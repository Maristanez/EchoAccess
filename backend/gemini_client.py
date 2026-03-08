from google import genai
from google.genai import types
import os
import json
import asyncio
import logging

logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemini-2.5-flash"
NO_THINK = types.GenerateContentConfig(
    thinking_config=types.ThinkingConfig(thinking_budget=0)
)


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()


async def _call_gemini(prompt: str, max_retries: int = 5) -> str:
    """Call Gemini with automatic retry on rate-limit (429) errors."""
    for attempt in range(max_retries):
        try:
            response = await client.aio.models.generate_content(model=MODEL, contents=prompt, config=NO_THINK)
            return response.text
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                # Try to parse the retry delay from the error metadata
                import re
                delay_match = re.search(r"retryDelay.*?'(\d+)s'", error_str)
                if delay_match:
                    wait = int(delay_match.group(1)) + 2  # add small buffer
                else:
                    wait = min(2 ** attempt * 10, 60)  # 10s, 20s, 40s, 60s, 60s
                logger.warning(
                    f"Gemini rate-limited (attempt {attempt + 1}/{max_retries}), "
                    f"retrying in {wait}s..."
                )
                await asyncio.sleep(wait)
            else:
                raise
    raise RuntimeError(f"Gemini API failed after {max_retries} retries (rate-limited)")


async def parse_form_html(raw_html: str) -> list[dict]:
    """Send HTML to Gemini, get structured field JSON back."""
    prompt = f"""You are an accessibility assistant. Given this HTML form, extract all input fields into a JSON array.
For each field return: {{ "id": str, "label": str, "type": str, "required": bool, "placeholder": str, "options": [str] if select/radio else null }}
Rewrite any cryptic or technical labels into plain English. Ignore decorative/non-input elements.
HTML:
{raw_html}
Return ONLY valid JSON array. No explanation. No markdown."""

    text = await _call_gemini(prompt)
    return json.loads(_strip_fences(text))


async def generate_question(
    form_name: str, next_field: dict, answered: list, profile: dict
) -> dict:
    """Generate the next conversational question for the user."""
    prompt = f"""You are EchoAccess, a friendly voice assistant helping a blind user fill out the "{form_name}" form.
Next field: {json.dumps(next_field)}
Already answered: {json.dumps(answered)}
Profile: {json.dumps(profile)}

Ask one short friendly question for this field (1-2 sentences max). If it has options, list them. If profile has a match, suggest it.
Return ONLY JSON: {{ "question": "..." }}"""

    text = await _call_gemini(prompt)
    return json.loads(_strip_fences(text))


async def extract_answer(
    field: dict, question: str, user_response: str
) -> dict:
    """Interpret the user's conversational response and extract the actual value for the field."""
    prompt = f"""You are an accessibility assistant helping a blind user fill out a form.

The assistant just asked this question about a form field:
Question: "{question}"
Field info: {json.dumps(field)}

The user responded: "{user_response}"

Your job: extract the ACTUAL data value that should be saved for this form field.

Rules:
- If the user confirms a suggestion (e.g. "yes", "yeah", "that's correct", "yep", "right"), extract the value that was suggested in the question and return THAT value, not "yes".
- If the user provides a direct answer (e.g. "John", "john@email.com"), return that answer as-is.
- If the user corrects a suggestion (e.g. "no, it's Smith" or "actually it's different, my name is Smith"), extract the corrected value.
- If the user says something like "no" without providing an alternative, return exactly "NO_VALUE" so the system can re-ask.
- For select/radio fields with options, match the user's response to the closest option.
- Return ONLY the extracted data value as plain text. No quotes, no explanation, no JSON.

Examples:
- Question "Is your last name Bryan?" + Response "yes" → Bryan
- Question "What is your first name?" + Response "John" → John
- Question "Is your email john@test.com?" + Response "that's right" → john@test.com
- Question "Is your last name Bryan?" + Response "no, it's Smith" → Smith
- Question "Is your last name Bryan?" + Response "no" → NO_VALUE

Return ONLY the extracted value:"""

    text = await _call_gemini(prompt)
    value = text.strip().strip('"').strip("'")
    return {"value": value, "needs_reask": value == "NO_VALUE"}


async def generate_summary(form_name: str, answers: list) -> str:
    """Generate a plain-English summary of completed form."""
    prompt = f"""The user has finished the {form_name} form. Their answers: {json.dumps(answers)}
Read back a clear friendly summary before they confirm.
Group related fields (address together, personal info together).
Use natural speech. End with: "Would you like me to submit this, or is there anything you'd like to change?"
Return plain text only."""

    return await _call_gemini(prompt)


async def explain_errors(errors: list) -> str:
    """Rewrite form validation errors in plain friendly language."""
    prompt = f"""A web form returned these validation errors: {json.dumps(errors)}
Rewrite each error in plain friendly language for a blind user hearing it via text-to-speech.
No jargon. No "field is invalid." Say exactly what needs fixing and how.
Return a simple numbered list."""

    return await _call_gemini(prompt)

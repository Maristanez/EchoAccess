import google.generativeai as genai
import os
import json

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")


async def parse_form_html(raw_html: str) -> list[dict]:
    """Send HTML to Gemini, get structured field JSON back."""
    prompt = f"""You are an accessibility assistant. Given this HTML form, extract all input fields into a JSON array.
For each field return: {{ "id": str, "label": str, "type": str, "required": bool, "placeholder": str, "options": [str] if select/radio else null }}
Rewrite any cryptic or technical labels into plain English. Ignore decorative/non-input elements.
HTML:
{raw_html}
Return ONLY valid JSON array. No explanation. No markdown."""

    response = model.generate_content(prompt)
    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    return json.loads(text)


async def generate_question(
    form_name: str, next_field: dict, answered: list, profile: dict
) -> dict:
    """Generate the next conversational question for the user."""
    prompt = f"""You are EchoAccess, a warm and patient voice assistant helping a blind user fill out a form.
Form: {form_name}
Fields answered so far: {json.dumps(answered)}
Next field to ask: {json.dumps(next_field)}
User's stored profile: {json.dumps(profile)}
Generate one friendly plain-language question for the next field.
If the profile has a likely match for this field, suggest it naturally: "I have your address on file as 123 Main St — shall I use that?"
Keep it under 2 sentences. Sound human, not robotic.
Return JSON: {{ "question": str, "suggestion": str | null }}
Return ONLY valid JSON. No explanation. No markdown."""

    response = model.generate_content(prompt)
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    return json.loads(text)


async def generate_summary(form_name: str, answers: list) -> str:
    """Generate a plain-English summary of completed form."""
    prompt = f"""The user has finished the {form_name} form. Their answers: {json.dumps(answers)}
Read back a clear friendly summary before they confirm.
Group related fields (address together, personal info together).
Use natural speech. End with: "Would you like me to submit this, or is there anything you'd like to change?"
Return plain text only."""

    response = model.generate_content(prompt)
    return response.text


async def explain_errors(errors: list) -> str:
    """Rewrite form validation errors in plain friendly language."""
    prompt = f"""A web form returned these validation errors: {json.dumps(errors)}
Rewrite each error in plain friendly language for a blind user hearing it via text-to-speech.
No jargon. No "field is invalid." Say exactly what needs fixing and how.
Return a simple numbered list."""

    response = model.generate_content(prompt)
    return response.text

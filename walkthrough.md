# EchoAccess — Testing Walkthrough

Date: 2026-03-07

## Environment Verification

### Backend
- Server: `uvicorn main:app --reload --port 8000`
- Status: **PASS** — started cleanly after migrating from deprecated `google-generativeai` to `google-genai` SDK

### Frontend
- Build: `npm run build` (TypeScript compile + Vite bundle)
- Status: **PASS** — 0 TypeScript errors, bundle produced successfully
- Note: chunk size warning (532 kB JS) — expected for a hackathon app, not a blocker

---

## Bug Found & Fixed During Testing

**Issue:** Backend failed to start with `ModuleNotFoundError` on `google.generativeai`

**Root cause:** `google-generativeai` package is fully deprecated and broken. The new package is `google-genai` with a different API surface (`google.genai.Client` instead of `genai.GenerativeModel`).

**Fix applied:**
- Rewrote `backend/gemini_client.py` to use `from google import genai` and `genai.Client`
- Updated `backend/requirements.txt`: `google-generativeai` → `google-genai>=1.0.0`

---

## API Endpoint Results

| Endpoint | Method | Status | Notes |
|---|---|---|---|
| `/api/health` | GET | **PASS** | `{"status":"ok","backboard":true}` — Backboard connected |
| `/api/forms` | GET | **PASS** | Returns all 3 demo forms |
| `/api/new-session` | POST | **PASS** | Returns valid `thread_id` UUID |
| `/api/parse-form` | POST | **PASS** | Gemini correctly extracted all fields from `bank-account.html` with plain-English labels |
| `/api/chat` | POST | **PASS** | Generated question + Backboard memory suggestion ("I remember your first name is Alex") |
| `/api/save-answer` | POST | **PASS** | `{"ok":true}` |
| `/api/submit-form` | POST | **PASS** | Gemini produced natural-language summary grouped by category |

### Sample Chat Response (memory pre-fill working)
```json
{
  "question": "What's your first name?",
  "suggestion": "I remember your first name is Alex. Would you like me to fill that in for you?"
}
```

### Sample Submit Summary
```
Alright, Bryan, let's quickly review your TD Bank Account Application.
Your first name is Bryan, your last name is Maristanez, and your email is bryan@example.com.
Would you like me to submit this, or is there anything you'd like to change?
```

---

## Frontend UI Verification (manual)

To manually verify:
1. `cd frontend && npm run dev`
2. Open `http://localhost:5173`

Expected state machine flow:

| Step | Flow State | Expected |
|---|---|---|
| Load | IDLE | WelcomeBanner + FormSelector in header |
| Select form | PARSING → FIELD_LOOP | ChatPanel + FormPreview appear, assistant asks first question |
| Type answer | FIELD_LOOP | Field gets checkmark in FormPreview, next question asked |
| Mic input | FIELD_LOOP | Transcript auto-submitted, voice replies |
| All fields done | CONFIRMING | Dialog opens with Gemini summary |
| Click Submit | SUBMITTED | Confetti fires, success alert shown |
| Click Start Over | IDLE | State resets, WelcomeBanner returns |

---

## Known Gaps (not blockers for demo)

- Voice input requires Chrome/Edge (Web Speech API not supported in Firefox)
- No HTTPS — microphone access may require `localhost` origin (it does, so development is fine)
- Backboard `backboard-sdk` version pinned loosely; `>=1.0.0` in requirements.txt

---

## Overall Status

**Backend: READY**
**Frontend: READY (build verified, manual browser test pending)**
**Backboard memory: WORKING** (cross-session recall demonstrated)
**Gemini integration: WORKING** (form parsing + question generation + summary all passing)

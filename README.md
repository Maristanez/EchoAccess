# EchoAccess

Voice-first web form assistant for blind and low-vision users. Select any form, answer questions by speaking or typing, and let EchoAccess handle the rest — powered by Gemini 2.5 Flash and Backboard.io persistent memory.

## What It Does

EchoAccess converts inaccessible web forms into a guided voice conversation:

1. **Select a form** — TD Bank account application, TTC disability card, CRA benefits
2. **Gemini parses the HTML** — extracts all fields with plain-English labels
3. **EchoAccess asks questions** — one at a time, conversationally, via voice
4. **You answer** — by speaking or typing
5. **Backboard remembers you** — returning users get pre-filled suggestions from past sessions
6. **Confirm and submit** — hear a summary read back before you commit

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI + Python |
| LLM | Gemini 2.5 Flash (form parsing, question generation, summaries, error rewriting) |
| Memory | Backboard.io (persistent cross-session user profile) |
| Frontend | React 19 + Vite + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 + framer-motion |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |

## Project Structure

```
EchoAccess/
├── backend/
│   ├── main.py               # FastAPI app + all API routes
│   ├── gemini_client.py      # Gemini 2.5 Flash wrapper
│   ├── backboard_client.py   # Backboard.io memory wrapper
│   ├── requirements.txt
│   └── forms/
│       ├── bank-account.html
│       ├── transit-card.html
│       └── cra-benefits.html
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── types/index.ts
│       ├── hooks/
│       │   ├── useEchoAccess.ts  # State machine + API calls
│       │   └── useVoice.ts       # SpeechRecognition + SpeechSynthesis
│       ├── components/
│       │   ├── ChatPanel.tsx
│       │   ├── ChatMessage.tsx
│       │   ├── FormPreview.tsx
│       │   ├── FormSelector.tsx
│       │   ├── VoiceButton.tsx
│       │   ├── WelcomeBanner.tsx
│       │   ├── ProgressBar.tsx
│       │   └── magicui/          # Animation components
│       └── components/ui/        # shadcn/ui primitives
└── .env
```

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Gemini API key ([aistudio.google.com](https://aistudio.google.com))
- Backboard API key ([backboard.io](https://backboard.io)) — optional, enables memory features

### 1. Environment

```bash
cp .env .env.local
# Edit .env and add your keys:
# GEMINI_API_KEY=...
# BACKBOARD_API_KEY=...
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check + Backboard status |
| GET | `/api/forms` | List available forms |
| POST | `/api/parse-form` | Parse form HTML → structured fields |
| POST | `/api/new-session` | Create a Backboard memory thread |
| POST | `/api/chat` | Generate next conversational question |
| POST | `/api/save-answer` | Save field answer to memory |
| GET | `/api/user-profile` | Retrieve stored user profile |
| POST | `/api/submit-form` | Generate plain-English summary |

## How Memory Works

On first visit, EchoAccess stores your answers (name, email, address, etc.) in Backboard.io long-term memory tied to the assistant. On return visits, those facts are retrieved and injected into the conversation — so Gemini can say "I have your address on file as 123 Main St — shall I use that?"

Memory persists at the assistant level, meaning answers from one form session carry over to all future sessions across any form.

## Demo Forms

- **TD Bank Account Application** — personal info, SIN, employment, income
- **TTC Disability Discount Card** — accessibility-focused, ODSP/CPP, disability type
- **CRA Benefits Application** — SIN, marital status, dependents, direct deposit

## Accessibility

- `aria-live="polite"` on chat log for screen reader announcements
- `aria-label` on all interactive controls
- `aria-current="step"` on active form field
- Keyboard navigation: Tab through all controls, Enter to submit
- Voice-first by default — no mouse required

---

Built at Hack the Six 2026.

# EchoAccess

**Voice-first web form assistant for blind and low-vision users.** Select any form, answer questions by speaking or typing, and let EchoAccess handle the rest — powered by Gemini 2.5 Flash, Backboard.io persistent memory, and Supabase auth.

---

## What It Does

EchoAccess converts inaccessible web forms into a guided voice conversation:

1. **Sign in** — Create an account or log in with Supabase Auth
2. **Select a form** — TD Bank account application, TTC disability card, CRA benefits
3. **Gemini parses the HTML** — Extracts all fields with plain-English labels
4. **EchoAccess asks questions** — One at a time, conversationally, via voice
5. **You answer** — By speaking or typing
6. **Backboard remembers you** — Per-user memory; returning users get pre-filled suggestions from past sessions
7. **Confirm and submit** — Hear a summary read back before you commit

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| **Backend** | FastAPI + Python 3.11+ |
| **Auth** | Supabase Auth (JWT) |
| **Database** | Supabase (PostgreSQL) — `user_sessions` for per-user memory isolation |
| **LLM** | Gemini 2.5 Flash — form parsing, question generation, summaries |
| **Memory** | Backboard.io — persistent user profile per assistant/thread |
| **Frontend** | React 19 + Vite + TypeScript |
| **UI** | shadcn/ui + Tailwind CSS v4 + Framer Motion |
| **Voice** | Web Speech API (SpeechRecognition + SpeechSynthesis) |

---

## Project Structure

```text
EchoAccess/
├── backend/
│   ├── main.py               # FastAPI app + API routes
│   ├── gemini_client.py      # Gemini 2.5 Flash wrapper
│   ├── backboard_client.py   # Backboard.io memory wrapper
│   ├── supabase_client.py    # Supabase user_sessions (per-user assistant/thread)
│   ├── schema.sql            # Supabase migration for user_sessions
│   ├── dependencies/
│   │   └── auth.py           # JWT verification (Supabase)
│   ├── requirements.txt
│   └── forms/
│       ├── bank-account.html
│       ├── transit-card.html
│       └── cra-benefits.html
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── Auth.tsx          # Supabase Auth UI
│       │   ├── LandingPage.tsx
│       │   ├── StartPage.tsx
│       │   ├── ChatPanel.tsx
│       │   ├── ChatMessage.tsx
│       │   ├── FormPreview.tsx
│       │   ├── FormSelector.tsx
│       │   ├── VoiceButton.tsx
│       │   ├── ProgressBar.tsx
│       │   └── magicui/          # Animation components
│       ├── hooks/
│       │   ├── useEchoAccess.ts  # State machine + API calls
│       │   └── useVoice.ts       # SpeechRecognition + SpeechSynthesis
│       ├── lib/
│       │   └── supabase.ts      # Supabase client
│       └── types/
└── .env                        # Environment variables (gitignored)
```

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Gemini API key](https://aistudio.google.com)
- [Supabase project](https://supabase.com) — Auth + PostgreSQL
- [Backboard API key](https://backboard.io) — enables memory features

### 1. Clone and install

```bash
git clone https://github.com/Maristanez/EchoAccess.git
cd EchoAccess
```

### 2. Environment variables

Create a `.env` file in the project root:

**Backend (root `.env`):**

```bash
# Gemini
GEMINI_API_KEY=your_gemini_api_key

# Supabase (Dashboard → Settings → API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Backboard
BACKBOARD_API_KEY=your_backboard_api_key
# BACKBOARD_ASSISTANT_ID=  # Optional: copy from first backend startup to persist
```

**Frontend** — create `frontend/.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Supabase migration

Run the migration in [Supabase SQL Editor](https://supabase.com/dashboard) (your project → SQL Editor):

```sql
-- Contents of backend/schema.sql
CREATE TABLE IF NOT EXISTS user_sessions (
  user_id      UUID PRIMARY KEY,
  assistant_id TEXT NOT NULL,
  thread_id    TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON user_sessions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

### 4. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On first run, the backend creates a Backboard assistant and prints its ID. Copy it to `.env` as `BACKBOARD_ASSISTANT_ID` to persist across restarts.

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## API Reference

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/health` | — | Health check + Backboard status |
| GET | `/api/forms` | Bearer | List available forms |
| POST | `/api/parse-form` | Bearer | Parse form HTML → structured fields |
| POST | `/api/new-session` | Bearer | Create or reuse per-user Backboard thread |
| POST | `/api/chat` | Bearer | Generate next conversational question |
| POST | `/api/save-answer` | Bearer | Save field answer to memory |
| GET | `/api/user-profile` | Bearer | Retrieve stored user profile |
| POST | `/api/submit-form` | Bearer | Generate plain-English summary |

---

## How Memory Works

- **Per-user isolation:** Each user gets a dedicated Backboard assistant and thread stored in Supabase `user_sessions`. No cross-user memory leakage.
- **Persistent profile:** Answers (name, email, address, etc.) are stored in Backboard long-term memory. On return visits, facts are retrieved and injected into the conversation — e.g. *"I have your address on file as 123 Main St — shall I use that?"*
- **Cross-form:** Profile data carries over across all forms (bank, transit, CRA).

---

## Demo Forms

- **TD Bank Account Application** — Personal info, SIN, employment, income
- **TTC Disability Discount Card** — Accessibility-focused, ODSP/CPP, disability type
- **CRA Benefits Application** — SIN, marital status, dependents, direct deposit

---

## Accessibility

- `aria-live="polite"` on chat log for screen reader announcements
- `aria-label` on all interactive controls
- `aria-current="step"` on active form field
- Keyboard navigation: Tab through all controls, Enter to submit
- Voice-first by default — no mouse required

---

## Known Limitations

- Voice input requires Chrome or Edge (Web Speech API not supported in Firefox)
- Microphone access may require `localhost` or HTTPS in production

---

Built at **Hack the Six 2026**.

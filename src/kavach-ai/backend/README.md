# KAVACH AI Backend

FastAPI + Google Gemini 2.5 Flash. ~280 lines. No third-party dependencies beyond
`fastapi`, `google-genai`, `motor` (MongoDB).

## Setup

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env — fill GEMINI_API_KEY (get from https://aistudio.google.com/apikey)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/ai/health` | `{ llm_ready, model }` |
| POST | `/api/ai/chat` | Streaming text/plain chat |
| POST | `/api/ai/greeting` | One-shot personalized greeting |
| GET/POST | `/api/ai/preferences` | User prefs (name, language, family) |
| GET | `/api/ai/messages` | Chat history for a session |
| DELETE | `/api/ai/messages` | Clear a session |
| GET | `/api/family/state` | Family snapshot used as AI context |
| GET/POST | `/api/premium/*` | Optional premium-tier flow |

## Chat request shape

```json
POST /api/ai/chat
{
  "session_id": "sess-abc-123",
  "user_id":    "default-user",
  "text":       "Where is Mom?",
  "context": {
    "current_screen":   "/circle",
    "battery":          78,
    "gps":              "on",
    "city":             "New Delhi",
    "family_summary":   "Mom at home 12m ago · Dad travelling · Rahul home · Anjali no check-in",
    "protection_score": 88
  }
}
```

Response is **chunked `text/plain`** — read the body incrementally and update the UI.

## Deployment options

- **Render**: 1-click Web Service, free tier works. Add `MONGO_URL` (use MongoDB Atlas free 512MB).
- **Railway**: same pattern, $5 free credit.
- **Fly.io**: `fly launch` and `fly secrets set GEMINI_API_KEY=…`.
- **VPS (DigitalOcean/Hetzner)**: `uvicorn` behind nginx + `systemd`.

## Switching to Firebase Functions / Supabase Edge

The file is intentionally tiny. Port the four endpoints you actually use to your platform of choice — the system prompt is the most important piece, copy it verbatim from `server.py` line ~30.

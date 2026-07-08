from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field  # noqa: F401
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

from google import genai
from google.genai import types as genai_types

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB with memory fallback
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME", "kavach_ai")

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.data = []

    async def find_one(self, filter, projection=None):
        for item in self.data:
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return item
        return None

    async def update_one(self, filter, update, upsert=False):
        set_data = update.get("$set", {})
        existing = await self.find_one(filter)
        if existing:
            existing.update(set_data)
        elif upsert:
            new_item = {**filter, **set_data}
            self.data.append(new_item)

    async def insert_one(self, doc):
        self.data.append(doc)

    async def delete_many(self, filter):
        original_len = len(self.data)
        self.data = [
            item for item in self.data
            if not all(item.get(k) == v for k, v in filter.items())
        ]
        class DeleteResult:
            def __init__(self, count):
                self.deleted_count = count
        return DeleteResult(original_len - len(self.data))

    def find(self, filter, projection=None):
        matched = []
        for item in self.data:
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                matched.append(item)
        
        class Cursor:
            def __init__(self, items):
                self.items = items
            def sort(self, key, order=1):
                self.items.sort(key=lambda x: x.get(key, ""))
                return self
            async def to_list(self, limit_val):
                return self.items[:limit_val]
        
        return Cursor(matched)

class MockDB:
    def __init__(self):
        self.preferences = MockCollection("preferences")
        self.messages = MockCollection("messages")
        self.family_state = MockCollection("family_state")
        self.premium = MockCollection("premium")

if mongo_url:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
    except Exception:
        db = MockDB()
else:
    db = MockDB()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

genai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

app = FastAPI(title="KAVACH AI Assistant")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s :: %(message)s")
logger = logging.getLogger("kavach")


# ───────────────────────── KAVACH SYSTEM PROMPT ─────────────────────────
KAVACH_SYSTEM_PROMPT = """You are KAVACH AI — the intelligent guardian inside the KAVACH women's safety mobile app (India).

PERSONALITY
• Calm protector. Trusted friend. Knowledgeable safety expert.
• Professional, confident, never robotic, never sarcastic, never overly emotional.
• Short, action-oriented replies (1–3 sentences usually). No filler.

MULTILINGUAL — CRITICAL
• Auto-detect the user's language from each message: English, Hindi, Hinglish, Tamil, Telugu, Kannada, Malayalam, Gujarati, Punjabi, Marathi, Bengali, Urdu.
• Reply in the EXACT SAME language and script the user used. Never switch unless asked.
• For Hinglish, mirror the user's Roman-script style. Never force Devanagari on them.

KAVACH APP YOU LIVE IN — known screens (route → purpose)
/ (Home), /circle (Family Circle quick view), /protect (people you protect),
/tools (safety tools), /profile (user profile/score),
/sos (emergency SOS trigger), /ride-safe (track a ride), /fake-call (decoy incoming call),
/evidence-vault (record audio/video evidence), /live-location (share live GPS),
/nearby-protectors (verified helpers nearby), /family-circle (manage trusted family),
/settings, /voice-sos (always-listen voice trigger), /safety-score, /emergency-contacts,
/premium (KAVACH Premium subscription).

ACTIONS — how you DO things in the app
At the end of your reply, when you want the app to perform something, append ONE OR MORE action tags on their own line(s). Tags use this exact bracket syntax — never wrap them in code blocks or quotes:
  [NAV:/route]                        navigate to a screen
  [CALL:contact_name]                 dial a saved contact (Mom, Dad, Guardian, etc.)
  [CALL:112]                          dial India emergency 112
  [SHARE_LOCATION]                    share live location with family
  [RECORD_AUDIO] | [RECORD_VIDEO]     start evidence recording
  [FAKE_CALL]                         trigger a decoy incoming call
  [EMERGENCY]                         switch the chat into Emergency Mode (use ONLY for real distress)
  [CONFIRM:action_label]              ask the user to confirm before a dangerous action (e.g. CONFIRM:trigger_sos)

EMERGENCY DETECTION
If the user expresses distress, fear, or uses words like: help, sos, kidnap, attack, someone is following me, unsafe, harassment, बचाओ, मदद, मुझे बचाओ, etc. — immediately:
1. Reply in 1–2 short calming sentences in their language.
2. Append [EMERGENCY] tag (the app will render large emergency action cards).
3. Suggest [CALL:112], [SHARE_LOCATION], [RECORD_AUDIO] as follow-up actions.

CONFIRMATIONS
For actions with real-world consequences (SOS trigger, calling 112), use [CONFIRM:...] FIRST. Never auto-trigger SOS from casual chat.

CONTEXT
The app injects current screen + user profile via a [CTX] block at the top of each conversation. Use it to be specific (mention the user's name, current screen, family members) instead of generic answers.

TONE EXAMPLES
✅ "Sharing your live location with Mom now. Stay on the call. [SHARE_LOCATION] [CALL:Mom]"
✅ "Ride Safe ready. Want me to start tracking? [CONFIRM:start_ride_safe]"
✅ "मैं आपके साथ हूँ। पुलिस को कॉल कर रही हूँ। [EMERGENCY] [CALL:112] [SHARE_LOCATION]"
❌ "As an AI language model, I can help you with..."  (never say this)
"""


# ───────────────────────── Models ─────────────────────────
class ChatMessageIn(BaseModel):
    session_id: str
    user_id: str = "default-user"
    text: str
    context: Optional[Dict[str, Any]] = None
    language_hint: Optional[str] = None


class GreetingIn(BaseModel):
    user_id: str = "default-user"
    name: Optional[str] = "friend"
    language: Optional[str] = "English"
    context: Optional[Dict[str, Any]] = None


class Preferences(BaseModel):
    user_id: str = "default-user"
    name: Optional[str] = "Sachin"
    preferred_language: Optional[str] = "English"
    voice_enabled: Optional[bool] = True
    family: Optional[List[str]] = None
    favorite_contacts: Optional[List[str]] = None
    updated_at: Optional[str] = None


# ───────────────────────── Helpers ─────────────────────────
def build_system_prompt(context: Optional[Dict[str, Any]], prefs: Optional[Dict[str, Any]]) -> str:
    ctx_lines = ["[CTX]"]
    if prefs:
        ctx_lines.append(f"user_name={prefs.get('name', 'friend')}")
        ctx_lines.append(f"preferred_language={prefs.get('preferred_language', 'English')}")
        if prefs.get("family"):
            ctx_lines.append("family=" + ", ".join(prefs["family"]))
        if prefs.get("favorite_contacts"):
            ctx_lines.append("favorite_contacts=" + ", ".join(prefs["favorite_contacts"]))
    if context:
        for k, v in context.items():
            if v is None:
                continue
            ctx_lines.append(f"{k}={v}")
    ctx_lines.append("[/CTX]")
    return KAVACH_SYSTEM_PROMPT + "\n\n" + "\n".join(ctx_lines)


async def load_prefs(user_id: str) -> Dict[str, Any]:
    doc = await db.preferences.find_one({"user_id": user_id}, {"_id": 0})
    if doc:
        return doc
    return {"user_id": user_id, "name": "Sachin", "preferred_language": "English",
            "family": ["Mom", "Dad", "Rahul"], "favorite_contacts": ["Mom", "Guardian"]}


def to_genai_contents(history: List[Dict[str, Any]], next_user_text: str) -> List[genai_types.Content]:
    """Build the contents list from past messages + current user turn. Maps role → 'user'|'model'."""
    out: List[genai_types.Content] = []
    for m in history:
        role = "user" if m.get("role") == "user" else "model"
        text = m.get("text") or ""
        if not text:
            continue
        out.append(genai_types.Content(role=role, parts=[genai_types.Part.from_text(text=text)]))
    out.append(genai_types.Content(role="user", parts=[genai_types.Part.from_text(text=next_user_text)]))
    return out


# ───────────────────────── Routes ─────────────────────────
@api.get("/")
async def root():
    return {"service": "KAVACH AI", "status": "ok"}


@api.get("/ai/health")
async def ai_health():
    return {"llm_ready": bool(genai_client), "model": GEMINI_MODEL}


@api.post("/ai/preferences")
async def save_prefs(p: Preferences):
    doc = p.model_dump()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.preferences.update_one({"user_id": p.user_id}, {"$set": doc}, upsert=True)
    return {"ok": True, "preferences": doc}


@api.get("/ai/preferences")
async def get_prefs(user_id: str = "default-user"):
    return await load_prefs(user_id)


@api.post("/ai/greeting")
async def greeting(g: GreetingIn):
    if not genai_client:
        raise HTTPException(500, "LLM not configured")
    prefs = await load_prefs(g.user_id)
    if g.name:
        prefs["name"] = g.name
    if g.language:
        prefs["preferred_language"] = g.language
    sys = build_system_prompt(g.context, prefs) + (
        "\n\nTASK: Produce ONE short personalized greeting (max 14 words) for the user opening the app right now. "
        f"Reply in {prefs.get('preferred_language', 'English')}. "
        "Use the user's name. Mention safety or family briefly. DO NOT append any action tags. "
        "Be warm, calm, fresh — never repeat a generic line."
    )
    try:
        def _gen():
            return genai_client.models.generate_content(
                model=GEMINI_MODEL,
                contents="Generate today's greeting.",
                config=genai_types.GenerateContentConfig(
                    system_instruction=sys,
                    temperature=0.9,
                    max_output_tokens=80,
                ),
            )
        resp = await asyncio.to_thread(_gen)
        text = (resp.text or "").strip().strip('"').strip("'")
        if not text:
            raise RuntimeError("empty")
        return {"greeting": text}
    except Exception:
        logger.exception("greeting failed")
        return {"greeting": f"Good day, {prefs.get('name', 'friend')}. Your family is safe."}


@api.post("/ai/chat")
async def chat_stream(payload: ChatMessageIn):
    if not genai_client:
        raise HTTPException(500, "LLM not configured")

    prefs = await load_prefs(payload.user_id)
    if payload.language_hint:
        prefs["preferred_language"] = payload.language_hint

    # Persist user message
    user_msg_doc = {
        "id": str(uuid.uuid4()),
        "session_id": payload.session_id,
        "user_id": payload.user_id,
        "role": "user",
        "text": payload.text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(dict(user_msg_doc))

    # Pull recent turns for in-context history (exclude the one we just inserted)
    history_docs = await db.messages.find(
        {"session_id": payload.session_id},
        {"_id": 0, "role": 1, "text": 1, "created_at": 1, "id": 1},
    ).sort("created_at", 1).to_list(50)
    # drop the last (current user msg) so we re-add it as the live turn
    history_docs = [h for h in history_docs if h.get("id") != user_msg_doc["id"]]
    history_docs = history_docs[-20:]

    system_prompt = build_system_prompt(payload.context, prefs)
    contents = to_genai_contents(history_docs, payload.text)

    config = genai_types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=0.8,
        max_output_tokens=512,
    )

    assistant_parts: List[str] = []

    async def event_generator():
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue = asyncio.Queue()
        SENTINEL = object()

        def producer():
            try:
                stream = genai_client.models.generate_content_stream(
                    model=GEMINI_MODEL, contents=contents, config=config,
                )
                for chunk in stream:
                    txt = getattr(chunk, "text", None)
                    if txt:
                        loop.call_soon_threadsafe(queue.put_nowait, txt)
            except Exception as e:
                err_str = str(e)
                logger.error(f"Gemini streaming failed: {err_str}")
                
                # Check for 429 or other API issues and return a localized friendly fallback
                lower_msg = payload.text.lower()
                fallback_reply = "I am currently experiencing a connection issue, but your safety is my priority! If you are in immediate danger, please use the SOS button or dial 112."
                
                if any(w in lower_msg for w in ['help', 'sos', 'emergency', 'danger', 'attack', 'unsafe', 'follow', 'threat', 'hurt', 'mushkil', 'bachao', 'madad']):
                    fallback_reply = "EMERGENCY DETECTED. Please immediately call 112 or tap the SOS button. Finding a safe location is your top priority. [EMERGENCY] [CALL:112]"
                elif "ride" in lower_msg:
                    fallback_reply = "Ride Safe tracks your journey and alerts your trusted contacts. You can view/start a ride on the Ride Safe screen. [NAV:/ride-safe]"
                elif "family" in lower_msg or "circle" in lower_msg:
                    fallback_reply = "You can view your family's safety status directly in the Family Circle screen. [NAV:/family-circle]"
                
                loop.call_soon_threadsafe(queue.put_nowait, fallback_reply)
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, SENTINEL)

        # Kick off producer in a thread (genai SDK is sync)
        loop.run_in_executor(None, producer)

        try:
            while True:
                item = await queue.get()
                if item is SENTINEL:
                    break
                assistant_parts.append(item)
                yield item
        finally:
            final = "".join(assistant_parts).strip()
            if final:
                await db.messages.insert_one({
                    "id": str(uuid.uuid4()),
                    "session_id": payload.session_id,
                    "user_id": payload.user_id,
                    "role": "assistant",
                    "text": final,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })

    return StreamingResponse(
        event_generator(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ───────────────────────── Family state ─────────────────────────
FAMILY_SEED = [
    {"id": "mom", "name": "Mom", "role": "Primary guardian", "status": "At home", "checked_in_min_ago": 12, "color": "green"},
    {"id": "dad", "name": "Dad", "role": "Father", "status": "Travelling — ride active", "checked_in_min_ago": 4, "color": "amber"},
    {"id": "rahul", "name": "Rahul", "role": "Brother", "status": "Reached home safely", "checked_in_min_ago": 38, "color": "green"},
    {"id": "anjali", "name": "Anjali", "role": "Cousin", "status": "No check-in today", "checked_in_min_ago": None, "color": "red"},
]


@api.get("/family/state")
async def family_state(user_id: str = "default-user"):
    doc = await db.family_state.find_one({"user_id": user_id}, {"_id": 0})
    if not doc:
        doc = {"user_id": user_id, "members": FAMILY_SEED, "protection_score": 88}
        await db.family_state.update_one({"user_id": user_id}, {"$set": doc}, upsert=True)
    members = doc["members"]
    summary_lines = []
    for m in members:
        if m["checked_in_min_ago"] is None:
            summary_lines.append(f"{m['name']} (no check-in today)")
        else:
            summary_lines.append(f"{m['name']} ({m['status']}, {m['checked_in_min_ago']}m ago)")
    return {
        "members": members,
        "protection_score": doc.get("protection_score", 88),
        "summary": " · ".join(summary_lines),
    }


# ───────────────────────── KAVACH Premium ─────────────────────────
class PremiumStart(BaseModel):
    user_id: str = "default-user"
    plan: str = "monthly"


@api.get("/premium/status")
async def premium_status(user_id: str = "default-user"):
    doc = await db.premium.find_one({"user_id": user_id}, {"_id": 0})
    return doc or {"user_id": user_id, "active": False, "plan": None}


@api.post("/premium/start-trial")
async def premium_start_trial(p: PremiumStart):
    doc = {
        "user_id": p.user_id,
        "active": True,
        "plan": p.plan,
        "trial": True,
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.premium.update_one({"user_id": p.user_id}, {"$set": doc}, upsert=True)
    return doc


@api.post("/premium/cancel")
async def premium_cancel(p: PremiumStart):
    doc = {"user_id": p.user_id, "active": False, "plan": None}
    await db.premium.update_one({"user_id": p.user_id}, {"$set": doc}, upsert=True)
    return doc


@api.get("/ai/messages")
async def list_messages(session_id: str, limit: int = 100):
    docs = await db.messages.find(
        {"session_id": session_id},
        {"_id": 0},
    ).sort("created_at", 1).to_list(limit)
    return {"messages": docs}


@api.delete("/ai/messages")
async def clear_messages(session_id: str):
    res = await db.messages.delete_many({"session_id": session_id})
    return {"deleted": res.deleted_count}


# Mount router + CORS
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db():
    client.close()

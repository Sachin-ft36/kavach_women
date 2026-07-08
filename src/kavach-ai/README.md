# KAVACH AI — Drop-in Module

A self-contained React module that adds an AI Assistant (orb + chat sheet + voice overlay) to **any** React/Vite/Capacitor app. Backend: FastAPI + Google Gemini 2.5 Flash.

## What you get

- **Floating AI Orb** — tap → chat, long-press → voice
- **Chat sheet** — multilingual streaming chat (12 Indian languages)
- **Voice overlay** — Siri-like, Web Speech API STT + TTS (works in Capacitor Android WebView)
- **Action dispatcher** — AI emits `[NAV:/route]` / `[CALL:Mom]` / `[SHARE_LOCATION]` / `[EMERGENCY]` tags, you wire callbacks to your existing app actions
- **Emergency mode** — keyword-driven, large red action cards
- **Fully themeable** — every color/radius/font is a CSS variable, override in 5 lines

## 1. Drop the folder in

```
your-kavach-app/
  src/
    kavach-ai/          ← copy this whole folder here
    components/         (your existing stuff)
    pages/
```

## 2. Install peer deps

```bash
npm install   # the package.json has zero runtime deps; only peers: react >= 18
```

## 3. Mount the AI anywhere in your app

```tsx
// e.g. in App.tsx, after your existing routes/layout
import { KavachAI } from "./kavach-ai";
import "./kavach-ai/styles/kavach-ai.css";

export default function App() {
  return (
    <>
      {/* …your existing KAVACH app… */}

      <KavachAI
        apiBase="https://your-backend.com"  // your deployed FastAPI URL
        userName="Sachin"
        preferredLanguage="English"
        onAction={(action) => {
          // wire each action to YOUR existing app behavior
          switch (action.type) {
            case "nav":            navigate(action.route); break;
            case "call":           window.location.href = `tel:${action.target}`; break;
            case "share_location": yourShareLocationFn();   break;
            case "record_audio":   yourEvidenceFn("audio"); break;
            case "fake_call":      yourFakeCallFn();        break;
            case "emergency":      yourEmergencyFn();       break;
            case "confirm":        yourConfirmFn(action.label); break;
          }
        }}
      />
    </>
  );
}
```

That's it. The orb appears bottom-right. Tap it — chat opens. Long-press — voice. Done.

## 4. Backend setup

Inside `kavach-ai/backend/`:

```bash
cd kavach-ai/backend
cp .env.example .env
# Fill in GEMINI_API_KEY + MONGO_URL
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

Deploy on Render / Railway / Fly.io / any VPS. Point `apiBase` prop at the deployed URL.

> **Firebase / Supabase**: if you'd rather use Firebase Functions or Supabase Edge Functions, the `server.py` is intentionally tiny (~280 lines). Port the 4 endpoints (`/api/ai/chat`, `/api/ai/greeting`, `/api/ai/preferences`, `/api/family/state`) to your platform of choice. Frontend doesn't care where it's hosted.

## 5. Theme it (CSS variables)

In your app's global CSS or a wrapper rule, override any of these:

```css
:root {
  --kai-accent:        #FF3B7C;   /* YOUR brand color, replaces purple */
  --kai-accent-soft:   rgba(255,59,124,0.15);
  --kai-bg:            #0A0A0C;
  --kai-surface:       #141417;
  --kai-text:          #FFFFFF;
  --kai-text-soft:     rgba(255,255,255,0.6);
  --kai-danger:        #FF453A;
  --kai-success:       #30D158;
  --kai-radius:        20px;
  --kai-font:          "Plus Jakarta Sans", system-ui, sans-serif;
}
```

Full list in `src/kavach-ai/styles/kavach-ai.css`.

## 6. Capacitor permissions (Android)

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

iOS: Web Speech API does **not** work in WKWebView. For iOS install `@capacitor-community/speech-recognition` and we'll swap the STT implementation (1 file change in `useVoiceSTT.ts`).

## Component API

| Prop | Type | Default | Notes |
|---|---|---|---|
| `apiBase` | `string` | required | FastAPI backend URL |
| `userName` | `string` | `"friend"` | Personalisation |
| `preferredLanguage` | `string` | `"English"` | One of the 12 Indian languages |
| `userId` | `string` | `"default-user"` | For session/preference storage |
| `currentScreen` | `string` | `"/"` | Update from your router so AI knows context |
| `appContext` | `object` | `{}` | Anything: `{ battery, gps, family_summary, ride_safe, … }` |
| `onAction` | `(action) => void` | required | Hook AI actions into YOUR app |
| `position` | `"br" \| "bl" \| "tr" \| "tl"` | `"br"` | Orb corner |
| `hideOrb` | `boolean` | `false` | Hide default orb, trigger chat programmatically via `useKavachAI()` |
| `disableVoice` | `boolean` | `false` | Skip voice overlay |

### Imperative API (optional)

```tsx
import { useKavachAI } from "./kavach-ai";

function MyButton() {
  const { openChat, openVoice, sendMessage } = useKavachAI();
  return <button onClick={() => sendMessage("Trigger SOS")}>Help</button>;
}
```

## Actions emitted by the AI

```ts
type AIAction =
  | { type: "nav"; route: string }                // [NAV:/ride-safe]
  | { type: "call"; target: string }              // [CALL:Mom] or [CALL:112]
  | { type: "share_location" }                    // [SHARE_LOCATION]
  | { type: "record_audio" }                      // [RECORD_AUDIO]
  | { type: "record_video" }                      // [RECORD_VIDEO]
  | { type: "fake_call" }                         // [FAKE_CALL]
  | { type: "emergency" }                         // [EMERGENCY] — chat switches to red mode
  | { type: "confirm"; label: string };           // [CONFIRM:trigger_sos]
```

Wire each one to your existing KAVACH function. The AI handles all the language detection, intent parsing, and emergency keyword logic — your app just executes.

## Files in this folder

```
kavach-ai/
├── README.md                          ← this file
├── package.json
├── src/
│   ├── index.ts                       ← exports
│   ├── KavachAI.tsx                   ← root component, mounts everything
│   ├── KavachAIProvider.tsx           ← context + state
│   ├── components/
│   │   ├── AIOrb.tsx
│   │   ├── AIChatSheet.tsx
│   │   ├── AIVoiceOverlay.tsx
│   │   ├── GreetingBanner.tsx         ← optional standalone widget
│   │   ├── ActionChip.tsx
│   │   └── EmergencyCard.tsx
│   ├── hooks/
│   │   ├── useChat.ts                 ← streaming chat client
│   │   ├── useVoiceSTT.ts             ← Web Speech API STT
│   │   ├── useTTS.ts                  ← Web Speech API TTS
│   │   └── useGreeting.ts
│   ├── services/
│   │   ├── api.ts                     ← backend client
│   │   └── actionParser.ts
│   └── styles/
│       └── kavach-ai.css
└── backend/
    ├── server.py                      ← FastAPI + Gemini
    ├── requirements.txt
    ├── .env.example
    └── README.md
```

## License

MIT — yours to use, fork, and ship.

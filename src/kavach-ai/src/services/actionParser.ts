/**
 * Action tag parser.
 * AI emits tags like [NAV:/ride-safe] / [CALL:Mom] / [EMERGENCY] etc.
 * This strips them from display text and returns structured actions.
 */

export type AIAction =
  | { type: "nav"; route: string }
  | { type: "call"; target: string }
  | { type: "share_location" }
  | { type: "record_audio" }
  | { type: "record_video" }
  | { type: "fake_call" }
  | { type: "emergency" }
  | { type: "confirm"; label: string };

const TAG_RE =
  /\[(NAV|CALL|SHARE_LOCATION|RECORD_AUDIO|RECORD_VIDEO|FAKE_CALL|EMERGENCY|CONFIRM)(?::([^\]]+))?\]/g;

export function parseActions(raw: string): {
  display: string;
  actions: AIAction[];
  emergency: boolean;
} {
  const actions: AIAction[] = [];
  let emergency = false;
  const display = raw
    .replace(TAG_RE, (_m, kind: string, arg?: string) => {
      switch (kind) {
        case "NAV":
          if (arg) actions.push({ type: "nav", route: arg.trim() });
          break;
        case "CALL":
          if (arg) actions.push({ type: "call", target: arg.trim() });
          break;
        case "SHARE_LOCATION":
          actions.push({ type: "share_location" });
          break;
        case "RECORD_AUDIO":
          actions.push({ type: "record_audio" });
          break;
        case "RECORD_VIDEO":
          actions.push({ type: "record_video" });
          break;
        case "FAKE_CALL":
          actions.push({ type: "fake_call" });
          break;
        case "EMERGENCY":
          emergency = true;
          break;
        case "CONFIRM":
          if (arg) actions.push({ type: "confirm", label: arg.trim() });
          break;
      }
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { display, actions, emergency };
}

export function actionLabel(a: AIAction): string {
  switch (a.type) {
    case "nav":
      return `Open ${a.route.replace(/^\//, "") || "Home"}`;
    case "call":
      return a.target === "112" ? "Call 112" : `Call ${a.target}`;
    case "share_location":
      return "Share live location";
    case "record_audio":
      return "Record audio";
    case "record_video":
      return "Record video";
    case "fake_call":
      return "Trigger fake call";
    case "confirm":
      return "Confirm: " + a.label.replace(/_/g, " ");
    default:
      return "Action";
  }
}

/**
 * Backend API client. All endpoints are POST/GET to the FastAPI server at `apiBase`.
 */

export type ChatContext = {
  current_screen?: string;
  battery?: number | string;
  gps?: string;
  network?: string;
  city?: string;
  family_summary?: string;
  protection_score?: number;
  [k: string]: unknown;
};

/**
 * Streaming chat. Uses fetch + ReadableStream (modern browsers + Capacitor WebView).
 * Falls back to XHR onprogress if ReadableStream isn't available.
 */
export async function streamChat(opts: {
  apiBase: string;
  sessionId: string;
  userId: string;
  text: string;
  context?: ChatContext;
  onChunk: (chunkText: string, fullSoFar: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const url = `${opts.apiBase.replace(/\/$/, "")}/api/ai/chat`;
  const body = JSON.stringify({
    session_id: opts.sessionId,
    user_id: opts.userId,
    text: opts.text,
    context: opts.context || {},
  });

  // Prefer fetch + ReadableStream
  if (typeof ReadableStream !== "undefined" && typeof fetch !== "undefined") {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/plain" },
      body,
      signal: opts.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => "")}`.slice(0, 200));
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let full = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      opts.onChunk(chunk, full);
    }
    return full;
  }

  // XHR fallback (used when ReadableStream isn't available)
  return await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastIdx = 0;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "text/plain");
    xhr.onreadystatechange = () => {
      if (xhr.readyState >= 3 && xhr.responseText) {
        const ch = xhr.responseText.slice(lastIdx);
        if (ch) {
          lastIdx = xhr.responseText.length;
          opts.onChunk(ch, xhr.responseText);
        }
      }
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
        else reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("network error"));
    if (opts.signal) opts.signal.addEventListener("abort", () => xhr.abort());
    xhr.send(body);
  });
}

export async function fetchGreeting(
  apiBase: string,
  name: string,
  language: string,
  context: ChatContext,
  userId = "default-user",
): Promise<string> {
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/ai/greeting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, name, language, context }),
    });
    const j = await res.json();
    return j.greeting || `Good day, ${name}.`;
  } catch {
    return `Good day, ${name}. Your family is safe.`;
  }
}

export async function getPreferences(apiBase: string, userId = "default-user") {
  const r = await fetch(`${apiBase.replace(/\/$/, "")}/api/ai/preferences?user_id=${userId}`);
  return r.json();
}

export async function savePreferences(apiBase: string, prefs: Record<string, unknown>) {
  const r = await fetch(`${apiBase.replace(/\/$/, "")}/api/ai/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: "default-user", ...prefs }),
  });
  return r.json();
}

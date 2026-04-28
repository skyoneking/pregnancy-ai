const STORAGE_KEY = "chatbot:last-session";

export interface LastSession {
  assistantId: string;
  threadId: string | null;
}

export function getLastSession(): LastSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLastSession(assistantId: string, threadId: string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ assistantId, threadId }));
  } catch {
    // ignore storage errors
  }
}

export function clearLastSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

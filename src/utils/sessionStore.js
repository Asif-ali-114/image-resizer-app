export function saveToSession(key, value) {
  try {
    globalThis.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore session storage failures
  }
}

export function loadFromSession(key, fallback) {
  try {
    const raw = globalThis.sessionStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

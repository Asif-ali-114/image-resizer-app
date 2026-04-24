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

export function saveToLocal(key, value) {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures (private browsing, storage full, etc.)
  }
}

export function loadFromLocal(key, fallback) {
  try {
    const raw = globalThis.localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

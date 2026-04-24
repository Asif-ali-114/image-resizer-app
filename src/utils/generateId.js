/**
 * Generate a unique ID using crypto.randomUUID if available, or fallback to timestamp-based ID.
 * Use this instead of Date.now() + Math.random() patterns.
 * @returns {string} A unique identifier
 */
export function generateId() {
  if (typeof globalThis !== "undefined" && typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

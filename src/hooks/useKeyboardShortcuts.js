import { useEffect } from "react";

function isTypingTarget(target) {
  const tag = target?.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;
}

function eventToShortcut(event) {
  const parts = [];
  const ctrlLike = event.ctrlKey || event.metaKey;
  if (ctrlLike) parts.push("ctrl");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");

  let key = event.key.toLowerCase();
  if (key === " ") key = "space";
  if (key === "escape") key = "esc";
  parts.push(key);
  return parts.join("+");
}

export default function useKeyboardShortcuts(shortcuts, options = {}) {
  const { enabled = true, allowInInputs = false } = options;

  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event) => {
      if (!allowInInputs && isTypingTarget(event.target)) return;
      const key = eventToShortcut(event);
      const handler = shortcuts[key];
      if (!handler) return;
      const shouldPrevent = handler(event);
      if (shouldPrevent !== false) {
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [shortcuts, enabled, allowInInputs]);
}

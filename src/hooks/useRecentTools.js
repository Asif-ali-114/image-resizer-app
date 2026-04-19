import { useCallback, useState } from "react";

const STORAGE_KEY = "recentTools";

function readTools() {
  try {
    const raw = globalThis.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    return [];
  }
}

export default function useRecentTools() {
  const [recentTools, setRecentTools] = useState(() => readTools());

  const pushRecentTool = useCallback((toolId) => {
    const current = readTools();
    const next = [toolId, ...current.filter((item) => item !== toolId)].slice(0, 3);
    globalThis.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setRecentTools(next);
  }, []);

  return { recentTools, pushRecentTool };
}

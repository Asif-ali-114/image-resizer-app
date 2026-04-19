import { createContext, useCallback, useMemo, useRef, useState } from "react";

export const ToastContext = createContext(null);

const AUTO_MS = {
  success: 3000,
  info: 4000,
  warning: 5000,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((payload) => {
    const id = `${Date.now()}-${idRef.current += 1}`;
    const next = {
      id,
      type: payload?.type || "info",
      message: payload?.message || "Action completed.",
      action: payload?.action || null,
    };

    setToasts((current) => {
      const merged = [...current, next];
      return merged.length > 4 ? merged.slice(merged.length - 4) : merged;
    });

    const ms = AUTO_MS[next.type];
    if (ms) {
      window.setTimeout(() => removeToast(id), ms);
    }
    return id;
  }, [removeToast]);

  const value = useMemo(() => ({ toasts, showToast, removeToast }), [toasts, showToast, removeToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

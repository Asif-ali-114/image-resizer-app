import Btn from "./Btn.jsx";

const TOAST_TONE = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  error: "border-error/40 bg-error/10 text-error",
  info: "border-primary/30 bg-primary/10 text-on-surface",
  warning: "border-warn/40 bg-warn/10 text-warn",
};

const ICON = {
  success: "✓",
  error: "⚠",
  info: "i",
  warning: "!",
};

export default function Toast({ toasts, onRemove }) {
  if (!toasts?.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(360px,92vw)] flex-col gap-2">
      <style>{`@keyframes toast-in {from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl border p-3 shadow-card ${TOAST_TONE[toast.type] || TOAST_TONE.info}`}
          style={{ animation: "toast-in 0.2s ease" }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-sm font-bold">{ICON[toast.type] || ICON.info}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.message}</p>
              {toast.actionLabel && toast.onAction && (
                <div className="mt-2">
                  <Btn small variant="secondary" onClick={toast.onAction} aria-label={toast.actionLabel}>{toast.actionLabel}</Btn>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              className="rounded-full p-1 text-xs hover:bg-surface-container"
              aria-label="Close toast"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

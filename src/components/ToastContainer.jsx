import Btn from "./Btn.jsx";

const TONE = {
  success: {
    icon: "✓",
    border: "rgb(16 185 129)",
  },
  error: {
    icon: "✗",
    border: "rgb(var(--color-error))",
  },
  info: {
    icon: "ℹ",
    border: "rgb(var(--color-primary))",
  },
  warning: {
    icon: "⚠",
    border: "rgb(245 158 11)",
  },
};

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div
      className="fixed z-[120] flex w-[calc(100%-24px)] max-w-[380px] flex-col gap-2 sm:right-4 sm:top-4 sm:w-auto"
      style={{ top: 12, left: "50%", transform: "translateX(-50%)" }}
    >
      {toasts.map((toast) => {
        const tone = TONE[toast.type] || TONE.info;
        return (
          <div
            key={toast.id}
            className="animate-[toastIn_0.25s_ease-out] rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-3 shadow-card"
            style={{ borderLeft: `3px solid ${tone.border}` }}
            role="status"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-sm" aria-hidden="true">{tone.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-on-surface">{toast.message}</p>
                {toast.action && (
                  <button
                    type="button"
                    onClick={toast.action.onClick}
                    className="mt-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <Btn
                small
                variant="ghost"
                onClick={() => onRemove(toast.id)}
                aria-label="Dismiss notification"
              >
                ×
              </Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useMemo, useState } from "react";
import Btn from "./Btn.jsx";

function isEmailValid(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function FeedbackWidget({ onNotice }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [improvements, setImprovements] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => isEmailValid(email) && improvements.trim().length >= 5, [email, improvements]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        email: email.trim(),
        improvements: improvements.trim(),
        createdAt: new Date().toISOString(),
      };

      const key = "imagetools-feedback-submissions";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const next = Array.isArray(existing) ? [payload, ...existing].slice(0, 50) : [payload];
      localStorage.setItem(key, JSON.stringify(next));

      onNotice?.({ type: "success", message: "Thanks for the feedback. We saved your suggestion." });
      setEmail("");
      setImprovements("");
      setOpen(false);
    } catch {
      onNotice?.({ type: "error", message: "Could not save feedback right now. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <div className="fixed bottom-4 left-4 z-[120]">
        <Btn onClick={() => setOpen(true)} aria-label="Open feedback form" className="px-3 py-1.5 text-xs shadow-card" small>
          Feedback
        </Btn>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[120] w-[min(92vw,360px)] rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-headline text-lg font-bold text-on-surface">Share Feedback</h3>
          <p className="text-xs text-on-surface-variant">Tell us what to improve.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-2 py-1 text-sm text-on-surface-variant hover:bg-surface-container"
          aria-label="Close feedback form"
        >
          x
        </button>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <label className="block text-xs text-on-surface-variant">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="block text-xs text-on-surface-variant">
          Improvements
          <textarea
            value={improvements}
            onChange={(event) => setImprovements(event.target.value)}
            placeholder="What should we improve?"
            rows={4}
            required
          />
        </label>

        <div className="flex items-center gap-2">
          <Btn type="submit" disabled={!canSubmit || submitting} small>
            {submitting ? "Sending..." : "Send"}
          </Btn>
          <Btn type="button" variant="secondary" small onClick={() => setOpen(false)}>
            Cancel
          </Btn>
        </div>
      </form>
    </div>
  );
}

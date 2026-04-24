import { useEffect, useRef, useState } from "react";
import Btn from "../../Btn.jsx";
import Card from "../../Card.jsx";

export default function SaveNameModal({ open, defaultName, onSave, onClose }) {
  const [name, setName] = useState(defaultName || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setName(defaultName || "");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [defaultName, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220] bg-black/50" role="presentation" onClick={onClose}>
      <div className="mx-auto mt-20 w-[min(420px,calc(100%-24px))]" onClick={(event) => event.stopPropagation()}>
        <Card>
          <h3 className="text-lg font-semibold text-on-surface">Save Design</h3>
          <input
            ref={inputRef}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSave(name);
              if (event.key === "Escape") onClose();
            }}
            className="mt-3 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
            placeholder="Design name"
            maxLength={80}
            aria-label="Design name"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Btn small variant="secondary" onClick={onClose}>Cancel</Btn>
            <Btn small onClick={() => onSave(name)}>Save</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

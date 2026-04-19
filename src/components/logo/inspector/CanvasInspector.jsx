import { useRef } from "react";

const SIZE_CHIPS = [
  { label: "Square", w: 1080, h: 1080 },
  { label: "Landscape", w: 1280, h: 720 },
  { label: "Portrait", w: 1080, h: 1920 },
  { label: "Custom", w: null, h: null },
];

const POP_COLORS = ["#FFFFFF", "#F8FAFC", "#E2E8F0", "#0F172A", "#111827", "#4F46E5", "#4F8EF7", "#22C55E", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6"];

export default function CanvasInspector({ canvasWidth, canvasHeight, onApplyCanvasSize, onSetBackgroundColor, backgroundColor, onSetBackgroundGradient, onUploadBackground }) {
  const fileRef = useRef(null);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border p-3" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
        <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--logo-muted)]">Canvas Size</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {SIZE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              aria-label={`Set ${chip.label} canvas size preset`}
              onClick={() => {
                if (chip.w && chip.h) onApplyCanvasSize(chip.w, chip.h);
              }}
              className="logo-press rounded-full border px-3 py-1 text-[11px]"
              style={{ borderColor: "var(--logo-border)", color: "var(--logo-muted)", backgroundColor: "rgba(255,255,255,0.02)" }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <input aria-label="Canvas width" type="number" value={canvasWidth} onChange={(e) => onApplyCanvasSize(Number(e.target.value), canvasHeight)} />
          <input aria-label="Canvas height" type="number" value={canvasHeight} onChange={(e) => onApplyCanvasSize(canvasWidth, Number(e.target.value))} />
        </div>
      </section>

      <section className="rounded-xl border p-3" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
        <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--logo-muted)]">Background</h4>

        <div className="mt-3 grid grid-cols-6 gap-2">
          {POP_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Use background color ${color}`}
              className="logo-press h-7 rounded-md border"
              style={{ borderColor: "var(--logo-border)", backgroundColor: color }}
              onClick={() => onSetBackgroundColor(color)}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input type="color" aria-label="Choose custom background color" value={backgroundColor || "#ffffff"} onChange={(e) => onSetBackgroundColor(e.target.value)} />
          <input aria-label="Background hex color" value={backgroundColor || "#ffffff"} onChange={(e) => onSetBackgroundColor(e.target.value)} />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            aria-label="Apply gradient background"
            className="logo-press rounded-lg border px-3 py-1.5 text-xs text-[var(--logo-text)]"
            style={{ borderColor: "var(--logo-border)", backgroundImage: "linear-gradient(135deg,#4F8EF7,#6C63FF)" }}
            onClick={() => onSetBackgroundGradient?.(["#4F8EF7", "#6C63FF"])}
          >
            Gradient
          </button>

          <button
            type="button"
            aria-label="Upload background image"
            className="logo-press rounded-lg border px-3 py-1.5 text-xs text-[var(--logo-text)]"
            style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.03)" }}
            onClick={() => fileRef.current?.click()}
          >
            Upload image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUploadBackground?.(file);
              event.target.value = "";
            }}
          />
        </div>
      </section>
    </div>
  );
}

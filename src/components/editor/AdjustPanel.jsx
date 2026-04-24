import { useState } from "react";
import Card from "../Card.jsx";

const SLIDERS = [
  ["brightness", "Brightness", -100, 100, "Sun"],
  ["contrast", "Contrast", -100, 100, "Tone"],
  ["saturation", "Saturation", -100, 100, "Color"],
  ["sharpness", "Sharpness", 0, 100, "Sharp"],
  ["blur", "Blur", 0, 20, "Blur"],
  ["hue", "Hue Rotate", 0, 360, "Hue"],
  ["highlights", "Highlights", -100, 100, "Hi"],
  ["shadows", "Shadows", -100, 100, "Lo"],
  ["temperature", "Temperature", -100, 100, "Temp"],
  ["vignette", "Vignette", 0, 100, "Edge"],
];

const SLIDER_HINT = {
  brightness: "linear-gradient(90deg, rgba(15,23,42,.85), rgba(255,255,255,.95))",
  contrast: "linear-gradient(90deg, rgba(120,120,120,.55), rgba(120,120,120,.95))",
  saturation: "linear-gradient(90deg, rgba(148,163,184,.85), rgba(251,113,133,.85))",
  sharpness: "linear-gradient(90deg, rgba(148,163,184,.8), rgba(56,189,248,.85))",
  blur: "linear-gradient(90deg, rgba(56,189,248,.8), rgba(100,116,139,.8))",
  hue: "linear-gradient(90deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #ef4444)",
  highlights: "linear-gradient(90deg, rgba(15,23,42,.9), rgba(251,191,36,.9))",
  shadows: "linear-gradient(90deg, rgba(15,23,42,.95), rgba(148,163,184,.9))",
  temperature: "linear-gradient(90deg, rgba(59,130,246,.9), rgba(251,146,60,.9))",
  vignette: "linear-gradient(90deg, rgba(125,125,125,.8), rgba(15,23,42,.95))",
};

function formatSliderValue(key, value) {
  if (key === "hue") return `${value}deg`;
  if (key === "blur") return `${value}px`;
  if (key === "brightness" || key === "contrast" || key === "saturation") {
    return `${100 + value}%`;
  }
  return `${value > 0 ? "+" : ""}${value}`;
}

export default function AdjustPanel({ values, onChange }) {
  const [activeSlider, setActiveSlider] = useState(null);

  return (
    <Card className="editor-control-card">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-on-surface-variant">Adjustments</h3>
      <p className="mb-3 text-xs text-on-surface-variant">Live image updates while dragging.</p>
      <div className="space-y-3.5">
        {SLIDERS.map(([key, label, min, max, icon]) => (
          <label key={key} className={`editor-slider-group block rounded-xl p-2 text-xs text-on-surface-variant ${activeSlider === key ? "is-active" : ""}`}>
            <div className="editor-slider-meta mb-1 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2.5">
                <span className="inline-flex min-w-[36px] items-center justify-center rounded-md border border-outline-variant/30 px-1 py-0.5 text-[10px] uppercase tracking-[0.04em]">{icon}</span>
                <span className="text-[12px] font-semibold text-on-surface">{label}</span>
              </span>
              <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${values[key] !== 0 ? "bg-primary/15 text-primary" : "text-on-surface-variant"}`}>
                {formatSliderValue(key, values[key])}
              </span>
            </div>
            <div className="editor-slider-shell">
              <input
                type="range"
                min={min}
                max={max}
                value={values[key]}
                onChange={(e) => onChange(key, Number(e.target.value))}
                onPointerDown={() => setActiveSlider(key)}
                onPointerUp={() => setActiveSlider(null)}
                onPointerCancel={() => setActiveSlider(null)}
                onBlur={() => setActiveSlider(null)}
                onDoubleClick={() => onChange(key, key === "hue" ? 0 : min < 0 ? 0 : 0)}
                className={`editor-slider ${activeSlider === key ? "is-active" : ""}`}
                style={{
                  "--slider-pct": `${((values[key] - min) / (max - min)) * 100}%`,
                  "--slider-visual": SLIDER_HINT[key],
                }}
                aria-label={label}
              />
            </div>
            {values[key] !== 0 && (
              <div className="mt-1 text-right">
                <button
                  type="button"
                  onClick={() => onChange(key, 0)}
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-on-surface-variant hover:bg-surface-container"
                >
                  Reset
                </button>
              </div>
            )}
          </label>
        ))}
      </div>
    </Card>
  );
}

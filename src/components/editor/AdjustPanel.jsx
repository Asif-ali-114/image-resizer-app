import Card from "../Card.jsx";

const SLIDERS = [
  ["brightness", "Brightness", -100, 100],
  ["contrast", "Contrast", -100, 100],
  ["saturation", "Saturation", -100, 100],
  ["sharpness", "Sharpness", 0, 100],
  ["blur", "Blur", 0, 20],
  ["hue", "Hue Rotate", 0, 360],
  ["highlights", "Highlights", -100, 100],
  ["shadows", "Shadows", -100, 100],
  ["temperature", "Temperature", -100, 100],
  ["vignette", "Vignette", 0, 100],
];

export default function AdjustPanel({ values, onChange }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-on-surface-variant">Adjustments</h3>
      <div className="space-y-3">
        {SLIDERS.map(([key, label, min, max]) => (
          <label key={key} className="block text-xs text-on-surface-variant">
            <div className="mb-1 flex items-center justify-between"><span>{label}</span><span>{values[key]}</span></div>
            <input
              type="range"
              min={min}
              max={max}
              value={values[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              aria-label={label}
            />
          </label>
        ))}
      </div>
    </Card>
  );
}

import { QUICK_SWATCHES } from "../../../utils/logo/colorPalettes.js";

const GRADIENTS = [
  ["#FF6B6B", "#FFA500"], ["#0099FF", "#00FFCC"], ["#134E5E", "#71B280"], ["#7B2FF7", "#F107A3"],
  ["#0F2027", "#2C5364"], ["#F7971E", "#FFD200"], ["#FF9A9E", "#FECFEF"], ["#FFECD2", "#FCB69F"],
  ["#A1C4FD", "#C2E9FB"], ["#11998E", "#38EF7D"], ["#833AB4", "#FD1D1D"], ["#4E54C8", "#8F94FB"],
  ["#00C6FF", "#0072FF"], ["#56AB2F", "#A8E063"], ["#F953C6", "#B91D73"], ["#1D4350", "#A43931"],
  ["#16222A", "#3A6073"], ["#141E30", "#243B55"], ["#2BC0E4", "#EAECC6"], ["#614385", "#516395"],
];

export default function BackgroundPanel({ backgroundColor, onSetBackgroundColor, onSetBackgroundGradient, recentColors, onSetTransparent }) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--logo-muted)]">Background</h4>
      <div className="flex items-center gap-2">
        <input aria-label="Background color picker" type="color" value={backgroundColor || "#ffffff"} onChange={(e) => onSetBackgroundColor(e.target.value)} />
        <input aria-label="Background color hex" value={backgroundColor || "#ffffff"} onChange={(e) => onSetBackgroundColor(e.target.value)} />
      </div>

      <p className="text-[11px] font-semibold text-[var(--logo-muted)]">Quick Colors</p>
      <div className="grid grid-cols-6 gap-1">
        {QUICK_SWATCHES.map((color) => (
          <button key={color} type="button" aria-label={`Set quick background color ${color}`} className="logo-press h-5 rounded border" style={{ borderColor: "var(--logo-border)", backgroundColor: color }} onClick={() => onSetBackgroundColor(color)} />
        ))}
      </div>

      <p className="text-[11px] font-semibold text-[var(--logo-muted)]">Recent</p>
      <div className="flex gap-1">
        {recentColors.map((color) => <button key={color} type="button" aria-label={`Use recent color ${color}`} className="logo-press h-6 w-6 rounded border" style={{ borderColor: "var(--logo-border)", backgroundColor: color }} onClick={() => onSetBackgroundColor(color)} />)}
      </div>

      <p className="text-[11px] font-semibold text-[var(--logo-muted)]">Gradients</p>
      <div className="grid grid-cols-2 gap-2">
        {GRADIENTS.map((grad) => (
          <button key={grad.join("-")} type="button" aria-label="Apply gradient background" className="logo-press h-8 rounded border" style={{ borderColor: "var(--logo-border)", backgroundImage: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }} onClick={() => onSetBackgroundGradient(grad)} />
        ))}
      </div>

      <button type="button" aria-label="Set transparent background" className="logo-press w-full rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.03)" }} onClick={onSetTransparent}>Use Transparent Background</button>
    </div>
  );
}

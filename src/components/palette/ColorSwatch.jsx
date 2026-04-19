import Btn from "../Btn.jsx";

export default function ColorSwatch({ color, onCopy, highlighted }) {
  return (
    <div className={`overflow-hidden rounded-xl border ${highlighted ? "border-primary ring-2 ring-primary/30" : "border-outline-variant/30"} bg-surface-container-low transition hover:shadow-card-sm`}>
      <div className="h-20 w-full" style={{ background: color.hex }} />
      <div className="space-y-1 p-3">
        <p className="font-headline text-sm font-bold text-on-surface capitalize">{color.name}</p>
        <p className="font-mono text-sm font-semibold text-on-surface">{color.hex}</p>
        <p className="text-xs text-on-surface-variant">RGB: {color.rgb.r}, {color.rgb.g}, {color.rgb.b}</p>
        <p className="text-xs text-on-surface-variant">HSL: {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%</p>
        <p className="text-xs text-on-surface-variant">CMYK: {color.cmyk.c}, {color.cmyk.m}, {color.cmyk.y}, {color.cmyk.k}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full bg-primary" style={{ width: `${Math.max(1, color.frequency || 0)}%` }} />
        </div>
        <div className="flex gap-1 pt-1">
          <Btn small variant="secondary" onClick={() => onCopy(color.hex)} aria-label={`Copy ${color.hex}`}>Copy HEX</Btn>
          <Btn small variant="ghost" onClick={() => onCopy(`rgb(${color.rgb.r},${color.rgb.g},${color.rgb.b})`)} aria-label="Copy RGB">Copy RGB</Btn>
        </div>
      </div>
    </div>
  );
}

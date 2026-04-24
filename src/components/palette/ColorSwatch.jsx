import { useRef } from "react";
import Btn from "../Btn.jsx";

export default function ColorSwatch({ color, onCopy, highlighted, onSelect, onColorChange, onDragStart, onDragOver, onDrop, index }) {
  const colorInputRef = useRef(null);

  return (
    <div
      className={`overflow-hidden rounded-xl border ${highlighted ? "border-primary ring-2 ring-primary/30" : "border-outline-variant/30"} bg-surface-container-low transition hover:shadow-card-sm cursor-move`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      }}
      aria-pressed={highlighted}
      draggable
      onDragStart={(e) => onDragStart?.(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, index)}
    >
      <div
        className="h-20 w-full cursor-pointer relative group"
        style={{ background: color.hex }}
        onClick={(e) => {
          e.stopPropagation();
          colorInputRef.current?.click();
        }}
        title="Click to change color"
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="text-white text-xs font-semibold">Edit</span>
        </div>
      </div>
      <input
        ref={colorInputRef}
        type="color"
        value={color.hex}
        onChange={(e) => onColorChange?.(index, e.target.value)}
        className="sr-only"
      />
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

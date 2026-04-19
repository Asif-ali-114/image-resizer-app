export default function PaletteCanvas({ imageUrl, colors }) {
  if (!imageUrl) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low p-2">
      <img src={imageUrl} alt="Palette source" className="max-h-[420px] w-full rounded-lg object-contain" />
      {colors.slice(0, 8).map((color, index) => (
        <span
          key={`${color.hex}-${index}`}
          className="absolute h-3 w-3 rounded-full border border-white/80"
          style={{
            background: color.hex,
            left: `${12 + (index * 10)}%`,
            top: `${18 + (index * 6)}%`,
          }}
        />
      ))}
    </div>
  );
}

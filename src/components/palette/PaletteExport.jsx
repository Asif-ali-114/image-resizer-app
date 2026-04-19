import Btn from "../Btn.jsx";
import Card from "../Card.jsx";

function slug(name) {
  return String(name || "color").toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");
}

export function buildCssVariables(colors) {
  const lines = colors.map((color) => `  --color-${slug(color.name)}: ${color.hex};`);
  return [":root {", ...lines, "}"].join("\n");
}

export function buildScssVariables(colors) {
  return colors.map((color) => `$color-${slug(color.name)}: ${color.hex};`).join("\n");
}

export default function PaletteExport({ colors, onCopyAll, onDownload }) {
  const css = buildCssVariables(colors);

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-on-surface-variant">Export</h3>
        <div className="flex gap-2">
          <Btn small variant="secondary" onClick={() => onCopyAll(css)} aria-label="Copy all css variables">Copy All</Btn>
          <Btn small onClick={() => onDownload("css", css)} aria-label="Download css variables">Download .css</Btn>
        </div>
      </div>
      <pre className="max-h-52 overflow-auto rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">{css}</pre>
    </Card>
  );
}

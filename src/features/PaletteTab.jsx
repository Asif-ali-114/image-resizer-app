import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import UrlImportModal from "../components/UrlImportModal.jsx";
import PaletteCanvas from "../components/palette/PaletteCanvas.jsx";
import ColorSwatch from "../components/palette/ColorSwatch.jsx";
import PaletteExport, { buildScssVariables } from "../components/palette/PaletteExport.jsx";
import { extractPalette, generatePaletteName } from "../utils/paletteUtils.js";

function imageDataFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = () => reject(new Error("Failed to decode image."));
    img.src = url;
  });
}

export default function PaletteTab({ onNotice }) {
  const inputRef = useRef(null);
  const [source, setSource] = useState(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [quality, setQuality] = useState("balanced");
  const [includeLight, setIncludeLight] = useState(true);
  const [includeDark, setIncludeDark] = useState(true);
  const [colors, setColors] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [paletteName, setPaletteName] = useState("Untitled Palette");

  const processFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (source?.url) URL.revokeObjectURL(source.url);
    setSource({ file, url, name: file.name });
  };

  const extract = useCallback(async () => {
    if (!source?.url) return;
    const imageData = await imageDataFromUrl(source.url);
    const extracted = extractPalette(imageData, count, quality, includeLight, includeDark);
    setColors(extracted);
    setPaletteName(generatePaletteName(extracted));
  }, [count, includeDark, includeLight, quality, source?.url]);

  useEffect(() => {
    const onShortcut = (event) => {
      if (event?.detail?.action === "palette-extract") {
        event.preventDefault?.();
        if (source?.url) {
          void extract();
        }
      }
    };
    window.addEventListener("imagetools:shortcut", onShortcut);
    return () => window.removeEventListener("imagetools:shortcut", onShortcut);
  }, [extract, source?.url]);

  const barGradient = useMemo(() => {
    if (!colors.length) return "";
    const total = colors.reduce((sum, color) => sum + Math.max(1, color.frequency || 1), 0);
    let cursor = 0;
    const parts = colors.map((color) => {
      const width = (Math.max(1, color.frequency || 1) / total) * 100;
      const start = cursor;
      const end = cursor + width;
      cursor = end;
      return `${color.hex} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    });
    return `linear-gradient(90deg, ${parts.join(",")})`;
  }, [colors]);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-headline text-3xl font-black text-on-surface">Color Palette Extractor</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Extract beautiful color palettes from any image.</p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {[3, 4, 5, 6, 8, 10, 12].map((n) => (
            <Btn key={n} small variant={count === n ? "primary" : "secondary"} onClick={() => setCount(n)} aria-label={`Extract ${n} colors`}>
              {n}
            </Btn>
          ))}
          <select value={quality} onChange={(e) => setQuality(e.target.value)} className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm" aria-label="Palette extraction quality">
            <option value="fast">Fast</option>
            <option value="balanced">Balanced</option>
            <option value="precise">Precise</option>
          </select>
          <label className="inline-flex items-center gap-1 text-xs text-on-surface-variant"><input type="checkbox" checked={includeLight} onChange={(e) => setIncludeLight(e.target.checked)} /> Include light</label>
          <label className="inline-flex items-center gap-1 text-xs text-on-surface-variant"><input type="checkbox" checked={includeDark} onChange={(e) => setIncludeDark(e.target.checked)} /> Include dark</label>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => inputRef.current?.click()} aria-label="Upload image for palette">Upload Image</Btn>
          <Btn variant="secondary" onClick={() => setUrlOpen(true)} aria-label="Import image URL for palette">Import from URL</Btn>
          <Btn onClick={extract} disabled={!source} aria-label="Extract palette">Re-extract</Btn>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <PaletteCanvas imageUrl={source?.url} colors={colors} />
        <Card>
          <label className="mb-3 block text-sm text-on-surface-variant">
            Palette Name
            <input value={paletteName} onChange={(e) => setPaletteName(e.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="Palette name" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {colors.map((color, index) => (
              <ColorSwatch
                key={`${color.hex}-${index}`}
                color={color}
                highlighted={highlightIndex === index}
                onCopy={async (value) => {
                  await navigator.clipboard.writeText(value);
                  onNotice?.({ type: "info", message: `${value} copied.` });
                }}
              />
            ))}
          </div>
        </Card>
      </div>

      {colors.length > 0 && (
        <Card>
          <div className="h-14 overflow-hidden rounded-lg" style={{ background: barGradient }}>
            <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${colors.length}, minmax(0,1fr))` }}>
              {colors.map((color, index) => (
                <button key={`${color.hex}-bar`} type="button" aria-label={`Jump to ${color.name}`} onClick={() => setHighlightIndex(index)} className="h-full w-full" title={`${color.name} ${color.hex}`} />
              ))}
            </div>
          </div>
        </Card>
      )}

      <PaletteExport
        colors={colors}
        onCopyAll={async (text) => {
          await navigator.clipboard.writeText(text);
          onNotice?.({ type: "success", message: "CSS copied to clipboard" });
        }}
        onDownload={(type, text) => {
          const value = type === "scss" ? buildScssVariables(colors) : text;
          const blob = new Blob([value], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `palette.${type}`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      />

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => processFile(e.target.files[0])} />
      <UrlImportModal open={urlOpen} onClose={() => setUrlOpen(false)} onAdd={(files) => processFile(files[0])} />
    </div>
  );
}

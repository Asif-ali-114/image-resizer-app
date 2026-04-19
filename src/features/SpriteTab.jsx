import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import UrlImportModal from "../components/UrlImportModal.jsx";
import SpriteCanvas from "../components/sprite/SpriteCanvas.jsx";
import SpriteCSSOutput from "../components/sprite/SpriteCSSOutput.jsx";
import SpriteFileRow from "../components/sprite/SpriteFileRow.jsx";
import { generateCssClass, packSprites } from "../utils/spriteUtils.js";
import useDragToReorder from "../hooks/useDragToReorder.js";

async function loadImageDimensions(file) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((resolve, reject) => {
    const node = new Image();
    node.onload = () => resolve(node);
    node.onerror = () => reject(new Error("Failed to decode image"));
    node.src = url;
  });
  return { url, image: img, width: img.width, height: img.height };
}

export default function SpriteTab({ onNotice }) {
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [padding, setPadding] = useState(0);
  const [outerPadding, setOuterPadding] = useState(0);
  const [classPrefix, setClassPrefix] = useState("sprite-");
  const [bgMode, setBgMode] = useState("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [urlOpen, setUrlOpen] = useState(false);

  const dragApi = useDragToReorder({ items, onReorder: setItems });

  useEffect(() => () => {
    items.forEach((item) => item.url && URL.revokeObjectURL(item.url));
  }, [items]);

  const addFiles = async (list) => {
    const next = [];
    for (const file of Array.from(list || [])) {
      const meta = await loadImageDimensions(file);
      next.push({ id: `${Date.now()}-${Math.random()}`, file, name: file.name, ...meta });
    }
    setItems((current) => [...current, ...next]);
  };

  const packedState = useMemo(() => {
    const packed = packSprites(items, { padding, outerPadding, maxWidth: 2048 });
    const byName = new Map(items.map((item) => [item.name, item]));
    const enriched = packed.packed.map((entry) => ({ ...entry, image: byName.get(entry.name)?.image || null }));
    return { ...packed, packed: enriched };
  }, [items, padding, outerPadding]);

  const cssText = useMemo(() => {
    const lines = [`.sprite { background-image: url('sprites.png'); background-repeat: no-repeat; display:inline-block; }`];
    packedState.packed.forEach((sprite) => {
      lines.push(generateCssClass({ classPrefix, spriteName: sprite.name, x: sprite.x, y: sprite.y, width: sprite.width, height: sprite.height }));
    });
    return lines.join("\n");
  }, [classPrefix, packedState.packed]);

  const downloadAssets = useCallback(async () => {
    if (!packedState.packed.length) return;
    const canvas = document.createElement("canvas");
    canvas.width = packedState.width;
    canvas.height = packedState.height;
    const ctx = canvas.getContext("2d");
    if (bgMode === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (bgMode === "custom") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    packedState.packed.forEach((sprite) => {
      if (sprite.image) ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height);
    });

    const sheetBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const cssBlob = new Blob([cssText], { type: "text/css" });

    const zip = new JSZip();
    zip.file("sprites.png", sheetBlob);
    zip.file("sprites.css", cssBlob);
    const blob = await zip.generateAsync({ type: "blob" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sprite-pack.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotice?.({ type: "success", message: "Sprite assets downloaded." });
  }, [bgColor, bgMode, cssText, onNotice, packedState.height, packedState.packed, packedState.width]);

  useEffect(() => {
    const onShortcut = (event) => {
      if (event?.detail?.action === "sprite-generate") {
        event.preventDefault?.();
        if (items.length) {
          void downloadAssets();
        }
      }
    };
    window.addEventListener("imagetools:shortcut", onShortcut);
    return () => window.removeEventListener("imagetools:shortcut", onShortcut);
  }, [downloadAssets, items.length]);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-headline text-3xl font-black text-on-surface">Sprite Sheet Generator</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Pack images into one sprite sheet and generate CSS classes.</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card>
          <div className="space-y-3">
            <label className="block text-xs text-on-surface-variant">
              Padding
              <input type="number" value={padding} onChange={(e) => setPadding(Number(e.target.value) || 0)} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="Sprite padding" />
            </label>
            <label className="block text-xs text-on-surface-variant">
              Outer Padding
              <input type="number" value={outerPadding} onChange={(e) => setOuterPadding(Number(e.target.value) || 0)} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="Sprite outer padding" />
            </label>
            <label className="block text-xs text-on-surface-variant">
              CSS Prefix
              <input value={classPrefix} onChange={(e) => setClassPrefix(e.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="CSS class prefix" />
            </label>
            <label className="block text-xs text-on-surface-variant">
              Background
              <select value={bgMode} onChange={(e) => setBgMode(e.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="Sprite sheet background mode">
                <option value="transparent">Transparent</option>
                <option value="white">White</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            {bgMode === "custom" && <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} aria-label="Sprite background color" className="h-10 w-full rounded-lg" />}
          </div>
        </Card>

        <div className="space-y-3">
          <Card>
            <SpriteCanvas
              sprites={packedState.packed}
              width={packedState.width}
              height={packedState.height}
              bg={bgMode === "custom" ? bgColor : bgMode}
              hoverIndex={hoverIndex}
              onHover={setHoverIndex}
            />
            <p className="mt-2 text-xs text-on-surface-variant">Sheet size: {packedState.width} × {packedState.height}px</p>
            {hoverIndex >= 0 && packedState.packed[hoverIndex] && (
              <p className="mt-1 text-xs text-primary">{packedState.packed[hoverIndex].name} — {packedState.packed[hoverIndex].width}×{packedState.packed[hoverIndex].height} at ({packedState.packed[hoverIndex].x}, {packedState.packed[hoverIndex].y})</p>
            )}
          </Card>

          <SpriteCSSOutput cssText={cssText} onCopy={async () => {
            await navigator.clipboard.writeText(cssText);
            onNotice?.({ type: "info", message: "CSS copied to clipboard." });
          }} />
        </div>
      </div>

      <Card>
        <div className="space-y-2">
          {items.map((item, index) => (
            <SpriteFileRow
              key={item.id}
              item={packedState.packed.find((entry) => entry.id === item.id) || item}
              index={index}
              onRemove={(idx) => {
                const target = items[idx];
                if (target?.url) URL.revokeObjectURL(target.url);
                setItems((current) => current.filter((_, i) => i !== idx));
              }}
              dragApi={dragApi}
            />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Btn onClick={() => inputRef.current?.click()} aria-label="Add images for sprite">+ Add Images</Btn>
          <Btn variant="secondary" onClick={() => setUrlOpen(true)} aria-label="Import image URL for sprite">Import from URL</Btn>
          <Btn variant="ghost" onClick={() => {
            items.forEach((item) => item.url && URL.revokeObjectURL(item.url));
            setItems([]);
          }} aria-label="Clear sprite files">Clear All</Btn>
          <Btn onClick={downloadAssets} disabled={!items.length} aria-label="Download sprite png and css">↓ Download PNG + CSS</Btn>
        </div>
      </Card>

      <input ref={inputRef} type="file" className="hidden" multiple accept="image/*" onChange={(e) => addFiles(e.target.files)} />
      <UrlImportModal open={urlOpen} onClose={() => setUrlOpen(false)} onAdd={addFiles} />
    </div>
  );
}

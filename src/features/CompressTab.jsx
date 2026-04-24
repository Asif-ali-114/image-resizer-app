import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import ComparisonSlider from "../components/ComparisonSlider.jsx";
import UrlImportModal from "../components/UrlImportModal.jsx";
import DownloadButton from "../components/DownloadButton.jsx";
import { convertImage } from "../imagePipeline.js";
import { bytesToText } from "../utils/imageUtils.js";
import { getSupportedFormats } from "../utils/codecCapabilities.js";
import { loadFromSession, saveToSession } from "../utils/sessionStore.js";
import { generateId } from "../utils/generateId.js";
import { iconProps, ToolTrashIcon } from "../components/AppIcons.jsx";

export default function CompressTab({ onNotice }) {
  const [items, setItems] = useState([]);
  const [quality, setQuality] = useState(() => loadFromSession("compress.quality", 70));
  const [format, setFormat] = useState(() => loadFromSession("compress.format", "webp"));
  const [running, setRunning] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const supportedFormats = useMemo(() => getSupportedFormats(), []);

  useEffect(() => {
    if (!supportedFormats.length) return;
    if (!supportedFormats.includes(format)) {
      setFormat(supportedFormats[0]);
    }
  }, [format, supportedFormats]);

  useEffect(() => {
    saveToSession("compress.quality", quality);
  }, [quality]);

  useEffect(() => {
    saveToSession("compress.format", format);
  }, [format]);

  const urlsRef = useRef(new Set());

  useEffect(() => () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current.clear();
  }, []);

  const addFiles = useCallback((list) => {
    const next = Array.from(list || []).map((file) => {
      const originalUrl = URL.createObjectURL(file);
      urlsRef.current.add(originalUrl);
      return {
        id: generateId(),
        file,
        name: file.name,
        originalUrl,
        result: null,
        status: "pending",
        error: null,
      };
    });
    setItems((current) => [...current, ...next]);
  }, []);

  const removeItem = useCallback((id) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.originalUrl) {
        URL.revokeObjectURL(target.originalUrl);
        urlsRef.current.delete(target.originalUrl);
      }
      if (target?.result?.outputUrl) {
        URL.revokeObjectURL(target.result.outputUrl);
        urlsRef.current.delete(target.result.outputUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const runCompress = useCallback(async () => {
    setRunning(true);
    for (const item of items) {
      const result = await convertImage({ file: item.file, outputFormat: format, quality, background: "#ffffff" });
      if (result.error) {
        setItems((current) => current.map((x) => (x.id === item.id ? { ...x, status: "error", error: result.error } : x)));
      } else {
        const outputUrl = URL.createObjectURL(result.blob);
        urlsRef.current.add(outputUrl);
        if (result.warning === "target_size_unreachable") {
          onNotice?.({ type: "info", message: "Could not reach exact target size — returned closest result." });
        }
        setItems((current) => current.map((x) => (x.id === item.id ? { ...x, status: "done", result: { ...result, outputUrl } } : x)));
      }
    }
    setRunning(false);
    onNotice?.({ type: "success", message: "Compression finished." });
  }, [format, items, onNotice, quality]);

  useEffect(() => {
    const onShortcut = (event) => {
      if (event?.detail?.action === "compress-start") {
        event.preventDefault?.();
        if (!running && items.length) {
          void runCompress();
        }
      }
    };
    window.addEventListener("imagetools:shortcut", onShortcut);
    return () => window.removeEventListener("imagetools:shortcut", onShortcut);
  }, [items.length, runCompress, running]);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-headline text-3xl font-black text-on-surface">Compress Images</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Reduce image size while preserving visual quality.</p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm" aria-label="Compression output format">
            {["webp", "jpeg", "avif"].map((fmt) => (
              <option key={fmt} value={fmt} disabled={!supportedFormats.includes(fmt)} title={!supportedFormats.includes(fmt) ? "Not supported in this browser" : undefined}>{fmt.toUpperCase()}</option>
            ))}
          </select>
          <label className="text-xs text-on-surface-variant">Quality {quality}
            <input type="range" min={1} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} aria-label="Compression quality" />
          </label>
          <Btn onClick={runCompress} disabled={!items.length || running} aria-label="Compress files">{running ? "Compressing..." : `Compress ${items.length} Files`}</Btn>
          <Btn variant="secondary" onClick={() => setUrlOpen(true)} aria-label="Import from URL for compress">Import from URL</Btn>
        </div>
      </Card>

      <Card>
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => document.getElementById("compress-input")?.click()}
          className="rounded-xl border-2 border-dashed border-primary/40 p-8 text-center"
          aria-label="Drop files to compress"
        >
          Drop images here or click to browse
          <input id="compress-input" type="file" multiple className="hidden" accept="image/*" onChange={(e) => addFiles(e.target.files)} />
        </div>
      </Card>

      {items.map((item) => (
        <Card key={item.id}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-on-surface">{item.name}</p>
            <div className="flex items-center gap-2">
              {item.result && <p className="text-xs text-on-surface-variant">{bytesToText(item.file.size)} → {bytesToText(item.result.convertedSize)}</p>}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-xs text-on-surface-variant transition-colors hover:text-error"
                aria-label={`Remove ${item.name}`}
              >
                <ToolTrashIcon {...iconProps} size={14} />
              </button>
            </div>
          </div>
          {item.result?.outputUrl ? (
            <ComparisonSlider
              before={item.originalUrl}
              after={item.result.outputUrl}
              beforeLabel="Before"
              afterLabel="Compressed"
              beforeInfo={bytesToText(item.file.size)}
              afterInfo={bytesToText(item.result.convertedSize)}
              width="100%"
              height={320}
            />
          ) : (
            <img src={item.originalUrl} alt={item.name} className="max-h-72 w-full rounded-lg object-contain" />
          )}
          {item.result?.blob && (
            <div className="mt-3">
              <DownloadButton
                blob={item.result.blob}
                filename={`${item.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")}_compressed.${item.result.outputFormat || format}`}
                label={`Download ${String(item.result.outputFormat || format).toUpperCase()}`}
              />
            </div>
          )}
        </Card>
      ))}

      <UrlImportModal open={urlOpen} onClose={() => setUrlOpen(false)} onAdd={addFiles} />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import DragHandle from "../components/DragHandle.jsx";
import UrlImportModal from "../components/UrlImportModal.jsx";
import { validateImageFile } from "../utils/fileValidation.js";
import { bytesToText } from "../utils/imageUtils.js";
import { processBulkImages } from "../imagePipeline.js";
import useDragToReorder from "../hooks/useDragToReorder.js";
import { isCodecSupported } from "../utils/codecCapabilities.js";

function Sec({ children, icon }) {
  return <h3 className="text-lg font-headline font-bold text-on-surface mb-4 flex items-center gap-2">{icon && <span className="text-xl">{icon}</span>}{children}</h3>;
}

export default function BulkTab({ onNotice }) {
  const [files, setFiles] = useState([]);
  const [scaleMode, setScaleMode] = useState("pixel");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [pct, setPct] = useState(50);
  const [format, setFormat] = useState("JPG");
  const [quality, setQuality] = useState(85);
  const [processing, setProcessing] = useState(false);
  const [progMap, setProgMap] = useState({});
  const [failed, setFailed] = useState([]);
  const [results, setResults] = useState([]);
  const [urlOpen, setUrlOpen] = useState(false);
  const inputRef = useRef(null);
  const MAX = 20;
  const orderedResults = useMemo(() => [...results].sort((a, b) => a.index - b.index), [results]);
  const orderedFailed = useMemo(() => [...failed].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)), [failed]);
  const dragApi = useDragToReorder({ items: files, onReorder: setFiles });
  const supportedFormats = useMemo(
    () => ["JPG", "PNG", "WebP"].filter((entry) => isCodecSupported(entry.toLowerCase() === "jpg" ? "jpeg" : entry.toLowerCase())),
    [],
  );

  useEffect(() => {
    if (!supportedFormats.length) return;
    if (!supportedFormats.includes(format)) {
      setFormat(supportedFormats[0]);
    }
  }, [format, supportedFormats]);

  const addFiles = useCallback(async (list) => {
    const all = Array.from(list || []);
    const checked = [];

    const validationFails = [];
    for (const f of all) {
      const validation = await validateImageFile(f);
      if (validation.ok) checked.push(f);
      else validationFails.push({ name: f.name, reason: validation.message });
    }

    const capped = checked.slice(0, MAX);
    const overLimit = checked.slice(MAX).map((f) => ({ name: f.name, reason: `Skipped: batch limit is ${MAX} files.` }));
    if (checked.length > MAX) onNotice?.({ type: "info", message: `Only the first ${MAX} valid files were queued.` });
    const total = capped.reduce((s, f) => s + f.size, 0);
    if (total > 200 * 1024 * 1024) {
      onNotice?.({ type: "error", message: "Batch total exceeds 200MB. Remove some files and try again." });
      setFailed([...validationFails, ...overLimit]);
      return;
    }

    setFiles(capped);
    setProgMap({});
    setFailed([...validationFails, ...overLimit]);
    setResults([]);
  }, [MAX, onNotice]);

  const processAll = useCallback(async () => {
    setProcessing(true);
    setResults([]);
    setFailed([]);

    try {
      await processBulkImages({
        files,
        settings: { scaleMode, width, height, pct, format, quality },
        onItemProgress: (index, progress) => {
          setProgMap((current) => ({ ...current, [index]: progress.progress }));
        },
        onItemResult: (result) => {
          const safeName = result.file.name
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 100);
          setResults((current) => [
            ...current,
            {
              index: result.index,
              name: `${safeName}_resized.${format.toLowerCase()}`,
              blob: result.blob,
              bytes: result.bytes,
            },
          ]);
          setProgMap((current) => ({ ...current, [result.index]: 100 }));
        },
        onItemFail: (failure) => {
          setFailed((current) => [
            ...current,
            {
              index: failure.index,
              name: failure.name,
              reason: failure.reason,
            },
          ]);
        },
      });
    } finally {
      setProcessing(false);
    }
  }, [files, format, height, pct, quality, scaleMode, width]);

  const clearQueue = useCallback(() => {
    files.forEach((f) => {
      if (f?.objectUrl) URL.revokeObjectURL(f.objectUrl);
    });
    setFiles([]);
    setProgMap({});
    setFailed([]);
    setResults([]);
  }, [files]);

  useEffect(() => {
    const onShortcut = (event) => {
      if (event?.detail?.action === "bulk-process-start") {
        event.preventDefault?.();
        if (!processing && files.length) {
          void processAll();
        }
      }
      if (event?.detail?.action === "bulk-clear") {
        event.preventDefault?.();
        clearQueue();
      }
    };

    window.addEventListener("imagetools:shortcut", onShortcut);
    return () => {
      window.removeEventListener("imagetools:shortcut", onShortcut);
    };
  }, [clearQueue, files.length, processAll, processing]);

  const downloadAll = async () => {
    if (!results.length) return;
    const zip = new JSZip();
    results.forEach((r) => zip.file(r.name, r.blob));
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "image-resizer-bulk.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeSingleFile = (index) => {
    setFiles((current) => {
      const entry = current[index];
      if (entry?.objectUrl) {
        URL.revokeObjectURL(entry.objectUrl);
      }
      return current.filter((_, i) => i !== index);
    });
    setProgMap((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
    setResults([]);
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        style={{ border: "2px dashed var(--c-blue)", borderRadius: 12, padding: 28, textAlign: "center", cursor: "pointer", background: "var(--c-bg)", marginBottom: 18 }}
      >
        <p style={{ margin: 0, color: "var(--c-navy)", fontWeight: 700, fontSize: 15 }}>
          📂 Drop up to {MAX} images
        </p>
        <p style={{ margin: "5px 0 0", color: "var(--c-muted)", fontSize: 12 }}>JPG · PNG · WebP · GIF · Max 200MB total</p>
        <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
        <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
          <Btn small variant="secondary" onClick={(e) => { e.stopPropagation(); setUrlOpen(true); }} aria-label="Import images from URL">Import from URL</Btn>
        </div>
      </div>

      <Card style={{ marginBottom: 18 }}>
        <Sec>⚙ Batch Settings</Sec>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--c-muted)", display: "block", marginBottom: 4 }}>Mode</label>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn onClick={() => setScaleMode("pixel")} variant={scaleMode === "pixel" ? "primary" : "ghost"} small>
                Pixels
              </Btn>
              <Btn onClick={() => setScaleMode("percent")} variant={scaleMode === "percent" ? "primary" : "ghost"} small>
                % Scale
              </Btn>
            </div>
          </div>
          {scaleMode === "pixel" ? (
            <>
              <div>
                <label style={{ fontSize: 11, color: "var(--c-muted)", display: "block", marginBottom: 4 }}>Width</label>
                <input type="number" value={width} onChange={(e) => setWidth(+e.target.value)} style={{ width: 76, padding: "7px 9px", border: "1px solid var(--c-blue)", borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--c-muted)", display: "block", marginBottom: 4 }}>Height</label>
                <input type="number" value={height} onChange={(e) => setHeight(+e.target.value)} style={{ width: 76, padding: "7px 9px", border: "1px solid var(--c-blue)", borderRadius: 6 }} />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 11, color: "var(--c-muted)", display: "block", marginBottom: 4 }}>Scale: {pct}%</label>
              <input type="range" min={1} max={300} value={pct} onChange={(e) => setPct(+e.target.value)} style={{ width: "100%", accentColor: "var(--c-navy)" }} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: "var(--c-muted)", display: "block", marginBottom: 4 }}>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ padding: "7px 9px", border: "1px solid var(--c-blue)", borderRadius: 6 }}>
              {["JPG", "PNG", "WebP"].map((f) => (
                <option key={f} disabled={!supportedFormats.includes(f)} title={!supportedFormats.includes(f) ? "Not supported in this browser" : undefined}>{f}</option>
              ))}
            </select>
          </div>
          {format !== "PNG" && (
            <div style={{ minWidth: 110 }}>
              <label style={{ fontSize: 11, color: "var(--c-muted)", display: "block", marginBottom: 4 }}>Quality: {quality}%</label>
              <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} style={{ width: "100%", accentColor: "var(--c-navy)" }} />
            </div>
          )}
        </div>
      </Card>

      {files.length > 0 && (
        <Card style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Sec>
              📋 Files ({files.length}/{MAX}) · {(files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB
            </Sec>
            <Btn
              onClick={clearQueue}
              variant="ghost"
              small
            >
              Clear All
            </Btn>
          </div>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              draggable
              onDragStart={() => dragApi.dragHandlers.onDragStart(i)}
              onDragOver={(e) => dragApi.dragHandlers.onDragOver(e, i)}
              onDrop={() => dragApi.dragHandlers.onDrop(i)}
              onDragEnd={dragApi.dragHandlers.onDragEnd}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--c-accent)", outline: dragApi.dragOverIndex === i ? "2px solid var(--c-blue)" : "none" }}
            >
              <DragHandle ariaLabel={`Drag ${f.name}`} dragging={dragApi.isDragging} />
              <span style={{ fontSize: 16 }}>🖼️</span>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 12, color: "var(--c-text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{f.name}</div>
                <div style={{ fontSize: 10, color: "var(--c-muted)" }}>{(f.size / 1024).toFixed(0)} KB</div>
              </div>
              <button
                type="button"
                onClick={() => removeSingleFile(i)}
                aria-label={`Remove ${f.name}`}
                style={{ border: "none", background: "transparent", color: "var(--c-danger)", fontSize: 16, cursor: "pointer" }}
              >
                ×
              </button>
              {progMap[i] !== undefined ? (
                <div style={{ width: 84 }}>
                  <div style={{ height: 5, background: "var(--c-lb)", borderRadius: 3 }}>
                    <div style={{ height: "100%", background: progMap[i] === 100 ? "var(--c-success)" : "var(--c-blue)", width: `${progMap[i]}%`, borderRadius: 3, transition: "width 0.08s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 2, textAlign: "right" }}>{progMap[i] === 100 ? "✓ Done" : `${progMap[i]}%`}</div>
                </div>
              ) : (
                <span style={{ fontSize: 10, color: "var(--c-muted)" }}>Pending</span>
              )}
            </div>
          ))}
        </Card>
      )}

      {orderedFailed.length > 0 && (
        <Card style={{ marginBottom: 18, border: "1px solid var(--c-danger)" }}>
          <Sec>❌ Failed Files</Sec>
          {orderedFailed.map((f, i) => (
            <div key={`${f.name}-${i}`} style={{ fontSize: 12, color: "var(--c-danger)", padding: "3px 0" }}>
              • {f.name} — {f.reason}
            </div>
          ))}
        </Card>
      )}

      {orderedResults.length > 0 && (
        <Card style={{ marginBottom: 18 }}>
          <Sec>✅ Processed Files</Sec>
          {orderedResults.map((r, i) => (
            <div key={`${r.name}-${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--c-accent)" }}>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 13, color: "var(--c-text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{bytesToText(r.bytes)}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {results.length === 0 ? (
          <Btn onClick={processAll} disabled={files.length === 0 || processing} style={{ flex: 1 }}>
            {processing ? "Processing..." : `⚡ Process ${files.length} File${files.length !== 1 ? "s" : ""}`}
          </Btn>
        ) : (
          <>
            <Btn onClick={downloadAll} variant="success" size="lg" style={{ flex: 1 }}>
              ⬇ Download ZIP
            </Btn>
            <Btn onClick={() => setResults([])} variant="secondary" size="lg" style={{ flex: 1 }}>
              Re-process
            </Btn>
          </>
        )}
      </div>

      <UrlImportModal open={urlOpen} onClose={() => setUrlOpen(false)} onAdd={addFiles} />
    </div>
  );
}

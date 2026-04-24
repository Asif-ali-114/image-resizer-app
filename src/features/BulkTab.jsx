import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import DragHandle from "../components/DragHandle.jsx";
import UrlImportModal from "../components/UrlImportModal.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { validateImageFile } from "../utils/fileValidation.js";
import { bytesToText } from "../utils/imageUtils.js";
import { downloadBlob, processBulkImages } from "../imagePipeline.js";
import useDragToReorder from "../hooks/useDragToReorder.js";
import { isCodecSupported } from "../utils/codecCapabilities.js";
import { iconProps, ToolAlertIcon, ToolBoxesIcon, ToolCheckIcon, ToolDownloadIcon, ToolImageIcon, ToolXIcon } from "../components/AppIcons.jsx";

const MAX = 20;

export default function BulkTab({ onNotice, prefillFiles }) {
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
  const isCancelledRef = useRef(false);
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
  }, [onNotice]);

  useEffect(() => {
    if (!prefillFiles?.id || !Array.isArray(prefillFiles.files) || !prefillFiles.files.length) return;
    void addFiles(prefillFiles.files);
  }, [addFiles, prefillFiles]);

  const processAll = useCallback(async () => {
    isCancelledRef.current = false;
    setProcessing(true);
    setResults([]);
    setFailed([]);

    try {
      await processBulkImages({
        files,
        settings: { scaleMode, width, height, pct, format, quality },
        isCancelledRef,
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
      isCancelledRef.current = false;
    }
  }, [files, format, height, pct, quality, scaleMode, width]);

  const handleCancel = useCallback(() => {
    isCancelledRef.current = true;
  }, []);

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
        className="mb-[18px] cursor-pointer rounded-xl border-2 border-dashed border-primary bg-surface p-7 text-center"
      >
        <p className="m-0 flex items-center justify-center gap-2 text-[15px] font-bold text-on-surface">
          <ToolBoxesIcon {...iconProps} size={16} />Drop up to {MAX} images
        </p>
        <p className="mb-0 mt-[5px] text-xs text-on-surface-variant">JPG · PNG · WebP · GIF · Max 200MB total</p>
        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <div className="mt-2.5 flex justify-center">
          <Btn small variant="secondary" onClick={(e) => { e.stopPropagation(); setUrlOpen(true); }} aria-label="Import images from URL">Import from URL</Btn>
        </div>
      </div>

      <Card className="mb-[18px]">
        <SectionHeader><span className="inline-flex items-center gap-2"><ToolBoxesIcon {...iconProps} size={16} />Batch Settings</span></SectionHeader>
        <div className="flex flex-wrap items-end gap-3.5">
          <div>
            <label className="mb-1 block text-xs text-on-surface-variant">Mode</label>
            <div className="flex gap-1.5">
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
                <label className="mb-1 block text-xs text-on-surface-variant">Width</label>
                <input type="number" value={width} onChange={(e) => setWidth(+e.target.value)} className="w-[76px] rounded-md border border-primary px-[9px] py-[7px]" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-on-surface-variant">Height</label>
                <input type="number" value={height} onChange={(e) => setHeight(+e.target.value)} className="w-[76px] rounded-md border border-primary px-[9px] py-[7px]" />
              </div>
            </>
          ) : (
            <div className="min-w-40 flex-1">
              <label className="mb-1 block text-xs text-on-surface-variant">Scale: {pct}%</label>
              <input type="range" min={1} max={300} value={pct} onChange={(e) => setPct(+e.target.value)} className="w-full accent-primary" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-on-surface-variant">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded-md border border-primary px-[9px] py-[7px]">
              {["JPG", "PNG", "WebP"].map((f) => (
                <option key={f} disabled={!supportedFormats.includes(f)} title={!supportedFormats.includes(f) ? "Not supported in this browser" : undefined}>{f}</option>
              ))}
            </select>
          </div>
          {format !== "PNG" && (
            <div className="min-w-[110px]">
              <label className="mb-1 block text-xs text-on-surface-variant">Quality: {quality}%</label>
              <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-primary" />
            </div>
          )}
        </div>
      </Card>

      {files.length > 0 && (
        <Card className="mb-[18px]">
          <div className="mb-2.5 flex items-center justify-between">
            <SectionHeader>
              <span className="inline-flex items-center gap-2"><ToolImageIcon {...iconProps} size={16} />Files ({files.length}/{MAX}) · {(files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB</span>
            </SectionHeader>
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
              className={`flex items-center gap-2.5 border-b border-outline-variant/40 py-[7px] ${dragApi.dragOverIndex === i ? "outline outline-2 outline-primary" : "outline-none"}`}
            >
              <DragHandle ariaLabel={`Drag ${f.name}`} dragging={dragApi.isDragging} />
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary"><ToolImageIcon {...iconProps} size={14} /></span>
              <div className="flex-1 overflow-hidden">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-on-surface">{f.name}</div>
                <div className="text-[10px] text-on-surface-variant">{(f.size / 1024).toFixed(0)} KB</div>
              </div>
              <button
                type="button"
                onClick={() => removeSingleFile(i)}
                aria-label={`Remove ${f.name}`}
                className="cursor-pointer border-none bg-transparent text-base text-error"
              >
                <ToolXIcon {...iconProps} size={14} />
              </button>
              {progMap[i] !== undefined ? (
                <div className="w-[84px]">
                  <div className="h-[5px] rounded bg-outline-variant/40">
                    <div className={`${progMap[i] === 100 ? "bg-green-400" : "bg-primary"} h-full rounded transition-[width] duration-100`} style={{ width: `${progMap[i]}%` }} />
                  </div>
                  <div className="mt-0.5 text-right text-[10px] text-on-surface-variant">{progMap[i] === 100 ? <span className="inline-flex items-center gap-1"><ToolCheckIcon {...iconProps} size={12} />Done</span> : `${progMap[i]}%`}</div>
                </div>
              ) : (
                <span className="text-[10px] text-on-surface-variant">Pending</span>
              )}
            </div>
          ))}
        </Card>
      )}

      {orderedFailed.length > 0 && (
        <Card className="mb-[18px] border border-error">
          <SectionHeader><span className="inline-flex items-center gap-2"><ToolAlertIcon {...iconProps} size={16} />Failed Files</span></SectionHeader>
          {orderedFailed.map((f, i) => (
            <div key={`${f.name}-${i}`} className="py-[3px] text-xs text-error">
              • {f.name} — {f.reason}
            </div>
          ))}
        </Card>
      )}

      {orderedResults.length > 0 && (
        <Card className="mb-[18px]">
          <SectionHeader><span className="inline-flex items-center gap-2"><ToolCheckIcon {...iconProps} size={16} />Processed Files</span></SectionHeader>
          {orderedResults.map((r, i) => (
            <div key={`${r.name}-${i}`} className="flex items-center gap-2.5 border-b border-outline-variant/40 py-2">
              <div className="flex-1 overflow-hidden">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-on-surface">{r.name}</div>
                <div className="text-xs text-on-surface-variant">{bytesToText(r.bytes)}</div>
              </div>
              <button
                type="button"
                onClick={() => downloadBlob(r.name, r.blob)}
                className="cursor-pointer rounded px-1.5 py-0.5 text-xs text-primary"
                aria-label={`Download ${r.name}`}
              >
                <ToolDownloadIcon {...iconProps} size={14} />
              </button>
            </div>
          ))}
        </Card>
      )}

      <div className="flex gap-2">
        {results.length === 0 ? (
          processing ? (
            <>
              <Btn disabled className="flex-1">
                {`Processing... (${Object.values(progMap).filter(p => p === 100).length}/${files.length})`}
              </Btn>
              <Btn onClick={handleCancel} variant="danger" className="flex-shrink-0">
                Cancel
              </Btn>
            </>
          ) : (
            <Btn onClick={processAll} disabled={files.length === 0 || processing} className="flex-1">
              {processing ? "Processing..." : `⚡ Process ${files.length} File${files.length !== 1 ? "s" : ""}`}
            </Btn>
          )
        ) : (
          <>
            <Btn onClick={downloadAll} variant="success" size="lg" className="flex-1">
              <span className="inline-flex items-center gap-2"><ToolDownloadIcon {...iconProps} size={16} />Download ZIP</span>
            </Btn>
            <Btn onClick={() => setResults([])} variant="secondary" size="lg" className="flex-1">
              Re-process
            </Btn>
          </>
        )}
      </div>

      <UrlImportModal open={urlOpen} onClose={() => setUrlOpen(false)} onAdd={addFiles} />
    </div>
  );
}

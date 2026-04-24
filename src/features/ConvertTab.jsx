import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import ConvertDropZone from "../components/ConvertDropZone.jsx";
import ConvertFileRow from "../components/ConvertFileRow.jsx";
import FormatBadge from "../components/FormatBadge.jsx";
import FormatMatrix from "../components/FormatMatrix.jsx";
import ConversionSummary from "../components/ConversionSummary.jsx";
import UrlImportModal from "../components/UrlImportModal.jsx";
import {
  INPUT_FORMATS,
  OUTPUT_FORMATS,
  canConvert,
  fileToFormat,
  formatLabel,
  getFormatMeta,
  getSupportedOutputFormats,
  isLossyFormat,
  needsBackgroundFill,
} from "../utils/convertUtils.js";
import { convertImage } from "../imagePipeline.js";
import useDragToReorder from "../hooks/useDragToReorder.js";
import { loadFromSession, saveToSession } from "../utils/sessionStore.js";
import { generateId } from "../utils/generateId.js";

function toMb(bytes) {
  return bytes / 1024 / 1024;
}

export default function ConvertTab({ onNotice }) {
  const [files, setFiles] = useState([]);
  const [globalFormat, setGlobalFormat] = useState(() => loadFromSession("convert.globalFormat", "webp"));
  const [quality, setQuality] = useState(() => loadFromSession("convert.quality", 85));
  const [background, setBackground] = useState("#ffffff");
  const [overrideRes, setOverrideRes] = useState(false);
  const [overrideW, setOverrideW] = useState("");
  const [overrideH, setOverrideH] = useState("");
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [showMatrix, setShowMatrix] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [pasteToast, setPasteToast] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const isRunningRef = useRef(false);

  const dragApi = useDragToReorder({ items: files, onReorder: setFiles });
  const supportedOutputs = useMemo(() => getSupportedOutputFormats(), []);

  useEffect(() => {
    if (!supportedOutputs.length) return;
    if (!supportedOutputs.includes(globalFormat)) {
      setGlobalFormat(supportedOutputs[0]);
    }
  }, [globalFormat, supportedOutputs]);

  useEffect(() => {
    saveToSession("convert.globalFormat", globalFormat);
  }, [globalFormat]);

  useEffect(() => {
    saveToSession("convert.quality", quality);
  }, [quality]);

  const anyNeedsBg = useMemo(
    () => files.some((item) => needsBackgroundFill(item.srcFormat, item.outputFormat)),
    [files],
  );

  const showQualityControl = useMemo(() => {
    if (!files.length) return isLossyFormat(globalFormat);
    return files.some((item) => isLossyFormat(item.outputFormat));
  }, [files, globalFormat]);

  const summary = useMemo(() => {
    const done = files.filter((entry) => entry.status === "done" && entry.result);
    if (!done.length) return null;

    const totalOriginal = done.reduce((sum, entry) => sum + entry.size, 0);
    const totalConverted = done.reduce((sum, entry) => sum + entry.result.convertedSize, 0);
    const savedBytes = totalOriginal - totalConverted;
    const avgReduction = totalOriginal > 0 ? (savedBytes / totalOriginal) * 100 : 0;

    return {
      filesConverted: done.length,
      mbSaved: toMb(savedBytes),
      avgReduction,
    };
  }, [files]);

  const addFiles = useCallback((list, fromPaste = false) => {
    const nextFiles = Array.from(list || []);
    if (!nextFiles.length) return;

    const additions = [];
    const failures = [];

    nextFiles.forEach((file) => {
      const srcFormat = fileToFormat(file);
      if (!INPUT_FORMATS.includes(srcFormat)) {
        failures.push(`${file.name}: unsupported source format.`);
        return;
      }

      if (!canConvert(srcFormat, globalFormat)) {
        failures.push(`${file.name}: cannot convert ${formatLabel(srcFormat)} to ${formatLabel(globalFormat)}.`);
        return;
      }

      if (!supportedOutputs.includes(globalFormat)) {
        failures.push(`${file.name}: ${formatLabel(globalFormat)} is not supported in this browser.`);
        return;
      }

      const thumbnail = URL.createObjectURL(file);
      additions.push({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        srcFormat,
        outputFormat: globalFormat,
        thumbnail,
        status: "pending",
        result: null,
        error: null,
        warning: srcFormat === "gif" && globalFormat !== "gif" ? "Animated GIFs will be flattened to one frame." : null,
        customFormat: false,
      });
    });

    if (failures.length) {
      setError(failures.slice(0, 3).join(" "));
      onNotice?.({ type: "error", message: `Some files were skipped (${failures.length}).` });
    } else {
      setError(null);
    }

    if (additions.length) {
      setFiles((current) => [...current, ...additions]);
      if (fromPaste) setPasteToast(true);
    }
  }, [globalFormat, onNotice, supportedOutputs]);

  const clearAll = useCallback(() => {
    files.forEach((entry) => {
      if (entry.thumbnail) URL.revokeObjectURL(entry.thumbnail);
      if (entry.result?.outputUrl) URL.revokeObjectURL(entry.result.outputUrl);
    });
    setFiles([]);
    setProgress({ done: 0, total: 0 });
    setError(null);
  }, [files]);

  useEffect(() => {
    return () => {
      files.forEach((entry) => {
        if (entry.thumbnail) URL.revokeObjectURL(entry.thumbnail);
        if (entry.result?.outputUrl) URL.revokeObjectURL(entry.result.outputUrl);
      });
    };
  }, [files]);

  useEffect(() => {
    if (!pasteToast) return undefined;
    const timer = setTimeout(() => setPasteToast(false), 2000);
    return () => clearTimeout(timer);
  }, [pasteToast]);

  useEffect(() => {
    const onPaste = (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      const pasted = [];
      for (const item of items) {
        if (item.type?.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) pasted.push(file);
        }
      }
      if (pasted.length) addFiles(pasted, true);
    };

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const handleConvert = useCallback(async () => {
    if (!files.length || converting || isRunningRef.current) return;
    isRunningRef.current = true;

    setConverting(true);
    setError(null);
    setProgress({ done: 0, total: files.length });

    const outW = overrideRes ? Math.max(1, Number(overrideW) || 0) : undefined;
    const outH = overrideRes ? Math.max(1, Number(overrideH) || 0) : undefined;
    const queue = [...files];
    const CONCURRENCY = 3;

    while (queue.length) {
      const batch = queue.splice(0, CONCURRENCY);
      await Promise.all(
        batch.map(async (item) => {
          setFiles((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "converting", error: null } : entry)));

          const result = await convertImage({
            file: item.file,
            outputFormat: item.outputFormat,
            quality,
            background,
            width: outW || undefined,
            height: outH || undefined,
          });

          if (result?.error) {
            setFiles((current) =>
              current.map((entry) =>
                entry.id === item.id
                  ? { ...entry, status: "error", error: result.error }
                  : entry,
              ),
            );
          } else {
            const outputUrl = URL.createObjectURL(result.blob);
            setFiles((current) =>
              current.map((entry) =>
                entry.id === item.id
                  ? {
                      ...entry,
                      status: "done",
                      result: {
                        blob: result.blob,
                        convertedSize: result.convertedSize,
                        outputUrl,
                      },
                    }
                  : entry,
              ),
            );
          }

          setProgress((current) => ({ ...current, done: current.done + 1 }));
        }),
      );
    }

    setConverting(false);
    isRunningRef.current = false;
  }, [background, converting, files, overrideH, overrideRes, overrideW, quality]);

  useEffect(() => {
    const onShortcut = (event) => {
      if (event?.detail?.action === "convert-start") {
        event.preventDefault?.();
        if (!converting && files.length) {
          void handleConvert();
        }
      }
      if (event?.detail?.action === "convert-clear") {
        event.preventDefault?.();
        clearAll();
      }
    };

    window.addEventListener("imagetools:shortcut", onShortcut);
    return () => {
      window.removeEventListener("imagetools:shortcut", onShortcut);
    };
  }, [clearAll, converting, files.length, handleConvert]);

  useEffect(() => {
    const onEnterConvert = (event) => {
      if (event.key !== "Enter") return;
      if (converting || files.length === 0) return;
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || event.target?.isContentEditable) return;
      event.preventDefault();
      void handleConvert();
    };

    document.addEventListener("keydown", onEnterConvert);
    return () => document.removeEventListener("keydown", onEnterConvert);
  }, [converting, files.length, handleConvert]);

  useEffect(() => {
    setFiles((current) =>
      current.map((entry) => {
        if (entry.customFormat) return entry;
        return {
          ...entry,
          outputFormat: globalFormat,
          warning: entry.srcFormat === "gif" && globalFormat !== "gif"
            ? "Animated GIFs will be flattened to one frame."
            : null,
        };
      }),
    );
  }, [globalFormat]);

  const onChangeFileFormat = (id, outputFormat) => {
    if (!supportedOutputs.includes(outputFormat)) return;
    setFiles((current) =>
      current.map((entry) => {
        if (entry.id !== id) return entry;
        return {
          ...entry,
          outputFormat,
          customFormat: true,
          warning: entry.srcFormat === "gif" && outputFormat !== "gif"
            ? "Animated GIFs will be flattened to one frame."
            : null,
        };
      }),
    );
  };

  const onRemoveFile = (id) => {
    setFiles((current) => {
      const target = current.find((entry) => entry.id === id);
      if (target?.thumbnail) URL.revokeObjectURL(target.thumbnail);
      if (target?.result?.outputUrl) URL.revokeObjectURL(target.result.outputUrl);
      return current.filter((entry) => entry.id !== id);
    });
  };

  const downloadZip = async () => {
    const done = files.filter((entry) => entry.status === "done" && entry.result?.blob);
    if (!done.length) return;

    const zip = new JSZip();
    done.forEach((item) => {
      const safeName = item.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
      const ext = getFormatMeta(item.outputFormat)?.ext || item.outputFormat;
      zip.file(`${safeName}_converted.${ext}`, item.result.blob);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "image-convert-results.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const doneCount = files.filter((entry) => entry.status === "done").length;

  return (
    <div className="space-y-5">

      {pasteToast && (
        <div className="fixed right-4 top-24 z-50 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-on-surface">
          Image pasted!
        </div>
      )}

      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="font-headline text-3xl font-black text-on-surface md:text-4xl">Image Converter</h2>
            <p className="mt-2 text-sm text-on-surface-variant md:text-base">Convert any image to any format. Batch ready.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {OUTPUT_FORMATS.map((fmt) => <FormatBadge key={fmt} format={fmt} />)}
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <label className="text-xs text-on-surface-variant">
            Output Format
            <select
              value={globalFormat}
              onChange={(e) => setGlobalFormat(e.target.value)}
              aria-label="Global output format"
              className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
            >
              {OUTPUT_FORMATS.map((fmt) => {
                const meta = getFormatMeta(fmt);
                  const supported = supportedOutputs.includes(fmt);
                  return <option key={fmt} value={fmt} disabled={!supported} title={supported ? undefined : "Not supported in this browser"}>{`${meta?.label || fmt} (.${meta?.ext || fmt})`}</option>;
              })}
            </select>
          </label>

          {showQualityControl && (
            <label className="text-xs text-on-surface-variant lg:col-span-2">
              Quality: {quality}
              <input
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                aria-label="Output quality"
                className="mt-2 w-full"
              />
            </label>
          )}

          {anyNeedsBg && (
            <label className="text-xs text-on-surface-variant">
              Background Fill
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                aria-label="Background fill color"
                className="mt-1 h-10 w-full rounded-lg"
              />
            </label>
          )}

          <label className="flex items-center gap-2 text-xs text-on-surface-variant">
            <input
              type="checkbox"
              checked={overrideRes}
              onChange={(e) => setOverrideRes(e.target.checked)}
              aria-label="Override resolution"
            />
            Override resolution
          </label>
        </div>

        {overrideRes && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <label className="text-xs text-on-surface-variant">
              Width
              <input
                type="number"
                min={1}
                value={overrideW}
                onChange={(e) => setOverrideW(e.target.value)}
                aria-label="Override width"
                className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-on-surface-variant">
              Height
              <input
                type="number"
                min={1}
                value={overrideH}
                onChange={(e) => setOverrideH(e.target.value)}
                aria-label="Override height"
                className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm"
              />
            </label>
          </div>
        )}
      </Card>

      <ConvertDropZone
        dragging={dragging}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onPick={addFiles}
        onImportUrl={() => setUrlOpen(true)}
      />

      {files.length === 0 && (
        <Card className="text-center">
          <div className="mx-auto mb-3 h-20 w-20 text-on-surface-variant/60">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-full w-full">
              <path d="M7 16V4m0 0L3 8m4-4l4 4" />
              <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <h3 className="font-headline text-2xl font-bold text-on-surface">No images yet</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Drop files above, click to browse, or paste with Ctrl+V</p>
        </Card>
      )}

      {files.length > 0 && (
        <Card>
          <div className="space-y-3">
            {files.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => dragApi.dragHandlers.onDragStart(idx)}
                onDragOver={(e) => dragApi.dragHandlers.onDragOver(e, idx)}
                onDrop={() => dragApi.dragHandlers.onDrop(idx)}
                onDragEnd={dragApi.dragHandlers.onDragEnd}
                className={dragApi.dragOverIndex === idx ? "rounded-xl ring-2 ring-primary" : ""}
              >
                <ConvertFileRow
                  item={item}
                  quality={quality}
                  background={background}
                  onChangeFormat={onChangeFileFormat}
                  supportedFormats={supportedOutputs}
                  onRemove={onRemoveFile}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Btn variant="ghost" onClick={clearAll} disabled={files.length === 0 || converting} aria-label="Clear all files">Clear All</Btn>
          <Btn onClick={handleConvert} disabled={files.length === 0 || converting} aria-label="Convert files">
            {converting
              ? <span className="inline-flex items-center gap-2"><span className="convert-spin inline-block h-4 w-4 rounded-full border-2 border-on-primary/80 border-t-transparent" />Converting...</span>
              : doneCount > 0
                ? "✓ Done — Convert Again"
                : `Convert ${files.length} File${files.length === 1 ? "" : "s"} →`}
          </Btn>
          <Btn variant="success" onClick={downloadZip} disabled={doneCount === 0 || converting} aria-label="Download all as zip">↓ ZIP</Btn>
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">or press Enter</p>

        {converting && (
          <div className="mt-4 space-y-1">
            <p className="text-xs text-on-surface-variant">Converting {progress.done} of {progress.total}...</p>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {summary && (
        <ConversionSummary
          filesConverted={summary.filesConverted}
          mbSaved={summary.mbSaved}
          avgReduction={summary.avgReduction}
        />
      )}

      <Card>
        <button
          type="button"
          onClick={() => setShowMatrix((value) => !value)}
          className="flex w-full items-center justify-between text-left"
          aria-label="Toggle format compatibility matrix"
        >
          <span className="font-headline text-lg font-bold text-on-surface">Format Compatibility</span>
          <span className="text-sm text-on-surface-variant">{showMatrix ? "Hide ▲" : "Show ▼"}</span>
        </button>
        <div className="mt-3">
          <FormatMatrix show={showMatrix} />
        </div>
      </Card>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <UrlImportModal open={urlOpen} onClose={() => setUrlOpen(false)} onAdd={addFiles} />
    </div>
  );
}

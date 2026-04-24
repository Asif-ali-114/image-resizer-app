import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import UrlImportModal from "../components/UrlImportModal.jsx";
import AdjustPanel from "../components/editor/AdjustPanel.jsx";
import TransformPanel from "../components/editor/TransformPanel.jsx";
import FilterPanel from "../components/editor/FilterPanel.jsx";
import HistoryPanel from "../components/editor/HistoryPanel.jsx";
import EditorCanvas from "../components/editor/EditorCanvas.jsx";
import { bytesToText } from "../utils/imageUtils.js";
import { filterStringFromAdjustments } from "../utils/editorUtils.js";
import { blobRegistry } from "../utils/BlobRegistry.js";
import { generateId } from "../utils/generateId.js";

const DEFAULT = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  blur: 0,
  hue: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  vignette: 0,
  angle: 0,
  flipX: false,
  flipY: false,
  presetFilter: "none",
};

function makeSnapshot(label, state) {
  return { id: generateId(), label, state: JSON.parse(JSON.stringify(state)) };
}

const PREVIEW_FILTER_STRINGS = {
  none: "",
  vivid: "saturate(1.4) contrast(1.1) brightness(1.05)",
  chrome: "contrast(1.2) brightness(1.05) saturate(0.9)",
  fade: "contrast(0.85) brightness(1.1) saturate(0.75)",
  noir: "grayscale(1) contrast(1.3) brightness(0.9)",
  warm: "sepia(0.3) saturate(1.2) brightness(1.05)",
  cool: "hue-rotate(200deg) saturate(0.9) brightness(1)",
  vintage: "sepia(0.5) contrast(0.85) brightness(0.9) saturate(0.8)",
  sepia: "sepia(1) contrast(1.1)",
  dramatic: "contrast(1.5) brightness(0.9) saturate(1.2) grayscale(0.2)",
};

function getRotatedDimensions(originalW, originalH, angleDeg) {
  const normalized = ((Number(angleDeg) % 360) + 360) % 360;
  const is90 = Math.abs(normalized - 90) < 1e-6;
  const is180 = Math.abs(normalized - 180) < 1e-6;
  const is270 = Math.abs(normalized - 270) < 1e-6;
  const is0 = Math.abs(normalized) < 1e-6;

  if (is90 || is270) {
    return { outW: originalH, outH: originalW };
  }
  if (is0 || is180) {
    return { outW: originalW, outH: originalH };
  }

  const rad = (normalized * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    outW: Math.ceil(originalW * cos + originalH * sin),
    outH: Math.ceil(originalW * sin + originalH * cos),
  };
}

/**
 * Shared canvas rendering logic used by both the live preview and the export/download.
 * @param {HTMLImageElement} img - Decoded source image element.
 * @param {{ angle: number, flipX: boolean, flipY: boolean }} transform - Rotation and flip state.
 * @param {string} cssFilter - Combined CSS filter string.
 * @param {{ maxWidth?: number }} options - Optional size cap for proxy rendering.
 * @returns {HTMLCanvasElement} The rendered canvas.
 */
function renderEdited(img, transform, cssFilter, { maxWidth } = {}) {
  let srcW = img.width;
  let srcH = img.height;

  // If a maxWidth is set and the image exceeds it, downscale the source dimensions
  if (maxWidth && srcW > maxWidth) {
    const scale = maxWidth / srcW;
    srcW = Math.round(srcW * scale);
    srcH = Math.round(srcH * scale);
  }

  const { outW, outH } = getRotatedDimensions(srcW, srcH, transform.angle);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  ctx.filter = cssFilter;
  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((transform.angle * Math.PI) / 180);
  ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1);
  ctx.drawImage(img, -srcW / 2, -srcH / 2, srcW, srcH);
  ctx.restore();
  return canvas;
}

async function generateFilterThumbnails(imageUrl) {
  const THUMB_SIZE = 80;
  const img = await new Promise((resolve, reject) => {
    const node = new Image();
    node.onload = () => resolve(node);
    node.onerror = () => reject(new Error("thumb load failed"));
    node.src = imageUrl;
  });

  const results = {};
  for (const [name, filterStr] of Object.entries(PREVIEW_FILTER_STRINGS)) {
    const canvas = document.createElement("canvas");
    canvas.width = THUMB_SIZE;
    canvas.height = THUMB_SIZE;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#888";
    ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE);
    ctx.filter = filterStr || "none";
    const scale = Math.max(THUMB_SIZE / img.width, THUMB_SIZE / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (THUMB_SIZE - dw) / 2, (THUMB_SIZE - dh) / 2, dw, dh);
    ctx.filter = "none";
    results[name] = canvas.toDataURL("image/jpeg", 0.7);
  }
  return results;
}

export default function EditorTab({ onNotice }) {
  const inputRef = useRef(null);
  const currentImageUrlRef = useRef(null);
  const [image, setImage] = useState(null);
  const [state, setState] = useState(DEFAULT);
  const [history, setHistory] = useState([]);
  const [redo, setRedo] = useState([]);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [filterThumbs, setFilterThumbs] = useState({});
  const previewTagRef = useRef(`editor-preview-${generateId()}`);

  const cssFilter = useMemo(() => filterStringFromAdjustments(state), [state]);

  useEffect(() => {
    const previewTag = previewTagRef.current;
    return () => {
      blobRegistry.release(previewTag);
      if (currentImageUrlRef.current) {
        URL.revokeObjectURL(currentImageUrlRef.current);
        currentImageUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!image?.url) {
      setFilterThumbs({});
      return undefined;
    }

    let cancelled = false;
    generateFilterThumbnails(image.url)
      .then((thumbs) => {
        if (!cancelled) setFilterThumbs(thumbs);
      })
      .catch(() => {
        // Keep empty thumbs when generation fails.
      });

    return () => {
      cancelled = true;
    };
  }, [image?.url]);

  const loadFile = useCallback((file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (currentImageUrlRef.current) {
      URL.revokeObjectURL(currentImageUrlRef.current);
    }
    currentImageUrlRef.current = url;
    setImage({ file, url, name: file.name, size: file.size });
    setState(DEFAULT);
    setHistory([]);
    setRedo([]);
  }, []);

  const openFilePicker = useCallback((event) => {
    event?.stopPropagation?.();
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.click();
  }, []);

  const update = useCallback((key, value, label = key) => {
    setState((previous) => {
      const next = { ...previous, [key]: value };
      setHistory((current) => [...current.slice(-49), makeSnapshot(`${label} ${value}`, previous)]);
      return next;
    });
    setRedo([]);
  }, []);

  const undo = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory((current) => current.slice(0, -1));
    setRedo((current) => [...current, makeSnapshot("redo", state)]);
    setState(prev.state);
  }, [history, state]);

  const redoOne = useCallback(() => {
    if (!redo.length) return;
    const next = redo[redo.length - 1];
    setRedo((current) => current.slice(0, -1));
    setHistory((current) => [...current, makeSnapshot("undo", state)]);
    setState(next.state);
  }, [redo, state]);

  const download = useCallback(async () => {
    if (!image) return;
    const img = await new Promise((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = () => reject(new Error("Could not load image."));
      node.src = image.url;
    });

    const canvas = renderEdited(img, state, cssFilter);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${image.name.replace(/\.[^.]+$/, "")}_edited.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    onNotice?.({ type: "success", message: "Edited image downloaded." });
  }, [cssFilter, image, onNotice, state]);

  useEffect(() => {
    const onPaste = (event) => {
      const item = [...(event.clipboardData?.items || [])].find((it) => it.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) loadFile(file);
    };
    const onUndo = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoOne();
      }
    };
    document.addEventListener("paste", onPaste);
    document.addEventListener("keydown", onUndo);
    return () => {
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("keydown", onUndo);
    };
  }, [download, loadFile, redoOne, undo]);

  useEffect(() => {
    const onShortcut = (event) => {
      if (event?.detail?.action === "editor-undo") {
        event.preventDefault?.();
        undo();
      }
      if (event?.detail?.action === "editor-redo") {
        event.preventDefault?.();
        redoOne();
      }
      if (event?.detail?.action === "editor-export") {
        event.preventDefault?.();
        void download();
      }
    };

    window.addEventListener("imagetools:shortcut", onShortcut);
    return () => {
      window.removeEventListener("imagetools:shortcut", onShortcut);
    };
  }, [download, redoOne, undo]);

  useEffect(() => {
    if (!image?.url) return undefined;

    const timer = window.setTimeout(async () => {
      try {
        const img = await new Promise((resolve, reject) => {
          const node = new Image();
          node.onload = () => resolve(node);
          node.onerror = () => reject(new Error("Could not load image."));
          node.src = image.url;
        });

        // Use a low-res proxy (max 800px wide) for the live preview to avoid
        // rendering full-resolution canvas on every slider adjustment.
        const canvas = renderEdited(img, state, cssFilter, { maxWidth: 800 });

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!blob) return;
        const nextUrl = URL.createObjectURL(blob);
        blobRegistry.replaceUrl(previewTagRef.current, nextUrl);
        setPreviewUrl(nextUrl);
      } catch {
        // Keep last preview when render fails.
      }
    }, 60);

    return () => {
      clearTimeout(timer);
    };
  }, [image, state, cssFilter]);

  if (!image) {
    return (
      <div className="space-y-4">
        <Card>
          <div
            className="rounded-2xl border-2 border-dashed border-primary/40 p-10 text-center neo-dropzone"
            role="button"
            tabIndex={0}
            onClick={openFilePicker}
            onDrop={(e) => {
              e.preventDefault();
              loadFile(e.dataTransfer.files[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openFilePicker(e);
            }}
            aria-label="Drop image for editor"
          >
            <p className="text-lg font-bold text-on-surface">Drop an image to start editing</p>
            <p className="mt-2 text-sm text-on-surface-variant">or click to browse</p>
            <div className="mt-3 flex justify-center gap-2">
              <Btn small onClick={openFilePicker} aria-label="Browse editor image">Browse Files</Btn>
              <Btn
                small
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setUrlModalOpen(true);
                }}
                aria-label="Import image from URL"
              >
                Import from URL
              </Btn>
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => loadFile(e.target.files[0])} />
          </div>
        </Card>
        <UrlImportModal open={urlModalOpen} onClose={() => setUrlModalOpen(false)} onAdd={(files) => loadFile(files[0])} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-3">
        <Card className="editor-control-card">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="truncate text-sm font-bold text-on-surface">{image.name}</p>
                <p className="text-xs text-on-surface-variant">{bytesToText(image.size)}</p>
              </div>
              <span className="ui-badge ui-badge--accent">Editor</span>
            </div>
            <div className="editor-action-grid grid grid-cols-2 gap-2">
              <Btn small variant="secondary" onClick={undo} aria-label="Undo edit">Undo</Btn>
              <Btn small variant="secondary" onClick={redoOne} aria-label="Redo edit">Redo</Btn>
              <Btn small variant="ghost" className="col-span-2" onClick={() => { setState(DEFAULT); setHistory([]); setRedo([]); }} aria-label="Reset all edits">Reset All</Btn>
              <Btn small className="col-span-2" onClick={download} aria-label="Save and download edited image">Save & Download</Btn>
            </div>
          </div>
        </Card>

        <AdjustPanel values={state} onChange={(key, value) => update(key, value, key)} />
        <TransformPanel
          angle={state.angle}
          onRotateLeft={() => update("angle", state.angle - 90, "Rotate")}
          onRotateRight={() => update("angle", state.angle + 90, "Rotate")}
          onFlipX={() => update("flipX", !state.flipX, "Flip H")}
          onFlipY={() => update("flipY", !state.flipY, "Flip V")}
          onStraighten={(value) => update("angle", value, "Straighten")}
          onAngle={(value) => update("angle", value, "Angle")}
        />
        <FilterPanel active={state.presetFilter} onSelect={(name) => update("presetFilter", name, `Filter ${name}`)} thumbByFilter={filterThumbs} />
        <HistoryPanel items={history} />
      </div>

      <div className="space-y-3">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-on-surface-variant">Live Canvas</p>
              <p className="text-sm font-semibold text-on-surface">Before / After Comparison</p>
            </div>
            <Btn small onClick={download} aria-label="Export edited image">Save</Btn>
          </div>
        </Card>
        <EditorCanvas
          originalUrl={image.url}
          previewUrl={previewUrl || image.url}
          beforeInfo={`${image.name} · ${bytesToText(image.size)}`}
          afterInfo="Edited preview"
        />
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
          <img
            src={previewUrl || image.url}
            alt="Edited preview"
            className="mx-auto max-h-[360px] w-full rounded-lg object-contain"
            style={{ filter: cssFilter, transform: `rotate(${state.angle}deg) scale(${state.flipX ? -1 : 1}, ${state.flipY ? -1 : 1})` }}
          />
        </div>
      </div>

      <UrlImportModal open={urlModalOpen} onClose={() => setUrlModalOpen(false)} onAdd={(files) => loadFile(files[0])} />
    </div>
  );
}

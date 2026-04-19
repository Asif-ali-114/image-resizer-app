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
  return { id: `${Date.now()}-${Math.random()}`, label, state: JSON.parse(JSON.stringify(state)) };
}

export default function EditorTab({ onNotice }) {
  const inputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [state, setState] = useState(DEFAULT);
  const [history, setHistory] = useState([]);
  const [redo, setRedo] = useState([]);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const previewTagRef = useRef(`editor-preview-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const cssFilter = useMemo(() => filterStringFromAdjustments(state), [state]);

  useEffect(() => {
    const imageUrl = image?.url;
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [image?.url]);

  useEffect(() => {
    const previewTag = previewTagRef.current;
    return () => {
      blobRegistry.release(previewTag);
    };
  }, []);

  const loadFile = useCallback((file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (image?.url) URL.revokeObjectURL(image.url);
    setImage({ file, url, name: file.name, size: file.size });
    setState(DEFAULT);
    setHistory([]);
    setRedo([]);
  }, [image?.url]);

  const pushHistory = useCallback((label, nextState) => {
    setHistory((current) => [...current.slice(-49), makeSnapshot(label, state)]);
    setRedo([]);
    setState(nextState);
  }, [state]);

  const update = useCallback((key, value, label = key) => {
    const next = { ...state, [key]: value };
    pushHistory(`${label} ${value}`, next);
  }, [pushHistory, state]);

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

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.filter = cssFilter;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((state.angle * Math.PI) / 180);
    ctx.scale(state.flipX ? -1 : 1, state.flipY ? -1 : 1);
    ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.restore();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${image.name.replace(/\.[^.]+$/, "")}_edited.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.filter = cssFilter;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((state.angle * Math.PI) / 180);
        ctx.scale(state.flipX ? -1 : 1, state.flipY ? -1 : 1);
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        ctx.restore();

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!blob) return;
        const nextUrl = URL.createObjectURL(blob);
        blobRegistry.replaceUrl(previewTagRef.current, nextUrl);
        setPreviewUrl(nextUrl);
      } catch {
        // Keep last preview when render fails.
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [image, state, cssFilter]);

  if (!image) {
    return (
      <div className="space-y-4">
        <Card>
          <div
            className="rounded-2xl border-2 border-dashed border-primary/40 p-10 text-center"
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              loadFile(e.dataTransfer.files[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            aria-label="Drop image for editor"
          >
            <p className="text-lg font-bold text-on-surface">Drop an image to start editing</p>
            <p className="mt-2 text-sm text-on-surface-variant">or click to browse</p>
            <div className="mt-3 flex justify-center gap-2">
              <Btn small onClick={() => inputRef.current?.click()} aria-label="Browse editor image">Browse Files</Btn>
              <Btn small variant="secondary" onClick={() => setUrlModalOpen(true)} aria-label="Import image from URL">Import from URL</Btn>
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => loadFile(e.target.files[0])} />
          </div>
        </Card>
        <UrlImportModal open={urlModalOpen} onClose={() => setUrlModalOpen(false)} onAdd={(files) => loadFile(files[0])} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-3">
        <Card>
          <div className="space-y-2">
            <p className="truncate text-sm font-bold text-on-surface">{image.name}</p>
            <p className="text-xs text-on-surface-variant">{bytesToText(image.size)}</p>
            <div className="flex gap-2">
              <Btn small variant="secondary" onClick={undo} aria-label="Undo edit">Undo</Btn>
              <Btn small variant="secondary" onClick={redoOne} aria-label="Redo edit">Redo</Btn>
            </div>
            <Btn small variant="ghost" onClick={() => { setState(DEFAULT); setHistory([]); setRedo([]); }} aria-label="Reset all edits">Reset All</Btn>
            <Btn small onClick={download} aria-label="Save and download edited image">Save & Download</Btn>
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
        <FilterPanel active={state.presetFilter} onSelect={(name) => update("presetFilter", name, `Filter ${name}`)} thumbByFilter={{}} />
        <HistoryPanel items={history} />
      </div>

      <div className="space-y-3">
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

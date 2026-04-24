import { useCallback, useEffect, useRef, useState } from "react";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import { num } from "../utils/imageUtils.js";
import SectionHeader from "../components/SectionHeader.jsx";


export default function CropStep({ image, onNext, onBack }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());
  const rafRef = useRef(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [cropEnabled, setCropEnabled] = useState(false);
  const [ratio, setRatio] = useState("free");
  const [crop, setCrop] = useState({ x: 0, y: 0, w: image.w, h: image.h });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragMode, setDragMode] = useState(null); // "new", "move", "nw", "ne", "sw", "se", "n", "s", "e", "w"
  const [history, setHistory] = useState([]);
  const RATIOS = [
    { l: "Free", v: "free" },
    { l: "1:1", v: 1 },
    { l: "4:3", v: 4 / 3 },
    { l: "16:9", v: 16 / 9 },
    { l: "3:2", v: 3 / 2 },
  ];
  const HANDLE_SIZE = 10;

  useEffect(() => {
    imgRef.current.onload = () => {
      setImgLoaded(true);
      setCrop({ x: 0, y: 0, w: image.w, h: image.h });
    };
    imgRef.current.src = image.url;
  }, [image.url, image.w, image.h]);

  const redraw = useCallback(() => {
    if (!imgLoaded || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const scale = canvas.width / image.w;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    if (cropEnabled && crop.w > 0 && crop.h > 0) {
      const cx = crop.x * scale;
      const cy = crop.y * scale;
      const cw = crop.w * scale;
      const ch = crop.h * scale;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(cx, cy, cw, ch);
      ctx.drawImage(imgRef.current, crop.x, crop.y, crop.w, crop.h, cx, cy, cw, ch);
      ctx.strokeStyle = "var(--c-blue)";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, cw, ch);

      // Draw resize handles
      const handleRadius = 5;
      const handles = {
        nw: [cx, cy],
        n: [cx + cw / 2, cy],
        ne: [cx + cw, cy],
        w: [cx, cy + ch / 2],
        e: [cx + cw, cy + ch / 2],
        sw: [cx, cy + ch],
        s: [cx + cw / 2, cy + ch],
        se: [cx + cw, cy + ch],
      };

      ctx.fillStyle = "white";
      ctx.strokeStyle = "var(--c-blue)";
      ctx.lineWidth = 1.5;
      for (const [, [hx, hy]] of Object.entries(handles)) {
        ctx.beginPath();
        ctx.arc(hx, hy, handleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }, [imgLoaded, image.w, cropEnabled, crop]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(redraw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [redraw]);

  const toImgCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const imgScale = canvas.width / image.w;
    return {
      x: ((e.clientX - rect.left) * scaleX) / imgScale,
      y: ((e.clientY - rect.top) * scaleY) / imgScale,
    };
  };

  const getHitTarget = (x, y) => {
    const { x: cx, y: cy, w, h } = crop;
    const handles = {
      nw: [cx, cy],
      n: [cx + w / 2, cy],
      ne: [cx + w, cy],
      w: [cx, cy + h / 2],
      e: [cx + w, cy + h / 2],
      sw: [cx, cy + h],
      s: [cx + w / 2, cy + h],
      se: [cx + w, cy + h],
    };
    for (const [name, [hx, hy]] of Object.entries(handles)) {
      if (Math.abs(x - hx) <= HANDLE_SIZE && Math.abs(y - hy) <= HANDLE_SIZE) return name;
    }
    if (x >= cx && x <= cx + w && y >= cy && y <= cy + h) return "move";
    return "new";
  };

  const beginDrag = (e) => {
    if (!cropEnabled) return;
    e.target.setPointerCapture(e.pointerId);
    const pos = toImgCoords(e);
    const mode = getHitTarget(pos.x, pos.y);
    
    setHistory((h) => [...h, { ...crop }]);
    setDragging(true);
    setDragStart(pos);
    setDragMode(mode);
    
    if (mode === "new") {
      setCrop({ x: Math.round(pos.x), y: Math.round(pos.y), w: 0, h: 0 });
    }
  };

  const moveDrag = (e) => {
    if (!dragging || !dragStart || !dragMode) return;
    const pos = toImgCoords(e);

    if (dragMode === "new") {
      // Drawing a new crop box
      let x = Math.min(dragStart.x, pos.x);
      let y = Math.min(dragStart.y, pos.y);
      let w = Math.abs(pos.x - dragStart.x);
      let h = Math.abs(pos.y - dragStart.y);
      if (ratio !== "free" && w > 0) h = w / ratio;
      x = Math.max(0, Math.min(x, image.w - w));
      y = Math.max(0, Math.min(y, image.h - h));
      w = Math.min(w, image.w - x);
      h = Math.min(h, image.h - y);
      setCrop({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    } else if (dragMode === "move") {
      // Moving the entire crop box
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      let newX = crop.x + dx;
      let newY = crop.y + dy;
      newX = Math.max(0, Math.min(newX, image.w - crop.w));
      newY = Math.max(0, Math.min(newY, image.h - crop.h));
      setCrop({ ...crop, x: Math.round(newX), y: Math.round(newY) });
      setDragStart(pos);
    } else {
      // Resizing via handles
      let newCrop = { ...crop };
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;

      if (dragMode.includes("n")) newCrop.y = Math.max(0, crop.y + dy);
      if (dragMode.includes("s")) newCrop.h = Math.max(10, crop.h + dy);
      if (dragMode.includes("w")) newCrop.x = Math.max(0, crop.x + dx);
      if (dragMode.includes("e")) newCrop.w = Math.max(10, crop.w + dx);

      // Apply aspect ratio lock if needed
      if (ratio !== "free" && dragMode !== "w" && dragMode !== "e") {
        newCrop.h = newCrop.w / ratio;
      }

      // Clamp to image boundaries
      newCrop.x = Math.max(0, Math.min(newCrop.x, image.w - newCrop.w));
      newCrop.y = Math.max(0, Math.min(newCrop.y, image.h - newCrop.h));
      newCrop.w = Math.min(newCrop.w, image.w - newCrop.x);
      newCrop.h = Math.min(newCrop.h, image.h - newCrop.y);

      setCrop({ x: Math.round(newCrop.x), y: Math.round(newCrop.y), w: Math.round(newCrop.w), h: Math.round(newCrop.h) });
    }
  };

  useEffect(() => {
    const stopDrag = () => setDragging(false);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("pointerup", stopDrag);
    return () => {
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("pointerup", stopDrag);
    };
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      if (!cropEnabled) return;
      if (e.key === "ArrowLeft") setCrop((c) => ({ ...c, x: Math.max(0, c.x - 1) }));
      if (e.key === "ArrowRight") setCrop((c) => ({ ...c, x: Math.min(image.w - c.w, c.x + 1) }));
      if (e.key === "ArrowUp") setCrop((c) => ({ ...c, y: Math.max(0, c.y - 1) }));
      if (e.key === "ArrowDown") setCrop((c) => ({ ...c, y: Math.min(image.h - c.h, c.y + 1) }));
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        setHistory((h) => {
          if (!h.length) return h;
          const prev = h[h.length - 1];
          setCrop(prev);
          return h.slice(0, -1);
        });
      }
    },
    [cropEnabled, image.w, image.h]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const validCrop = !cropEnabled || (crop.w >= 10 && crop.h >= 10);

  return (
    <div>
      <Card className="mb-3.5">
        <SectionHeader>✂️ Crop Tool</SectionHeader>
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-[5px] text-[13px] font-semibold text-on-surface">
            <input type="checkbox" checked={cropEnabled} onChange={(e) => setCropEnabled(e.target.checked)} />
            Enable Crop
          </label>
          {cropEnabled && (
            <>
              <span className="text-outline-variant/40">|</span>
              {RATIOS.map((r) => (
                <Btn key={r.l} onClick={() => setRatio(r.v)} variant={ratio === r.v ? "primary" : "ghost"} small>
                  {r.l}
                </Btn>
              ))}
              <Btn
                onClick={() => {
                  setHistory((h) => [...h, { ...crop }]);
                  setCrop({ x: 0, y: 0, w: image.w, h: image.h });
                }}
                variant="secondary"
                small
              >
                ↺ Reset
              </Btn>
              {history.length > 0 && (
                <Btn
                  onClick={() =>
                    setHistory((h) => {
                      if (!h.length) return h;
                      const prev = h[h.length - 1];
                      setCrop(prev);
                      return h.slice(0, -1);
                    })
                  }
                  variant="ghost"
                  small
                >
                  ⎌ Undo
                </Btn>
              )}
            </>
          )}
        </div>
        {cropEnabled && (
          <div className="mb-2.5 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
            <label className="text-xs text-on-surface-variant">
              X
              <input type="number" value={crop.x} min={0} max={image.w - 1} onChange={(e) => setCrop((c) => ({ ...c, x: Math.min(Math.max(0, num(e.target.value, 0)), image.w - c.w) }))} className="w-full rounded-md border border-outline-variant/40 p-1.5" />
            </label>
            <label className="text-xs text-on-surface-variant">
              Y
              <input type="number" value={crop.y} min={0} max={image.h - 1} onChange={(e) => setCrop((c) => ({ ...c, y: Math.min(Math.max(0, num(e.target.value, 0)), image.h - c.h) }))} className="w-full rounded-md border border-outline-variant/40 p-1.5" />
            </label>
            <label className="text-xs text-on-surface-variant">
              Width
              <input type="number" value={crop.w} min={1} max={image.w} onChange={(e) => setCrop((c) => ({ ...c, w: Math.min(Math.max(1, num(e.target.value, 1)), image.w - c.x) }))} className="w-full rounded-md border border-outline-variant/40 p-1.5" />
            </label>
            <label className="text-xs text-on-surface-variant">
              Height
              <input type="number" value={crop.h} min={1} max={image.h} onChange={(e) => setCrop((c) => ({ ...c, h: Math.min(Math.max(1, num(e.target.value, 1)), image.h - c.y) }))} className="w-full rounded-md border border-outline-variant/40 p-1.5" />
            </label>
          </div>
        )}
        <div className="flex justify-center overflow-hidden rounded-lg bg-surface-container">
          <canvas
            ref={canvasRef}
            width={Math.min(600, image.w)}
            height={Math.round(Math.min(600, image.w) * image.h / image.w)}
            className={`block max-w-full ${cropEnabled ? "cursor-crosshair" : "cursor-default"}`}
            style={{ touchAction: "none" }}
            onPointerDown={beginDrag}
            onPointerMove={moveDrag}
            onPointerUp={() => {
              setDragging(false);
              setDragMode(null);
            }}
            onPointerCancel={() => {
              setDragging(false);
              setDragMode(null);
            }}
          />
        </div>
      </Card>
      <div className="flex gap-2">
        <Btn onClick={onBack} variant="secondary">
          ← Back
        </Btn>
        <Btn onClick={() => onNext(cropEnabled && crop.w >= 10 && crop.h >= 10 ? crop : null)} disabled={cropEnabled && !validCrop && crop.w > 0} className="flex-1">
          {cropEnabled && crop.w >= 10 ? "Apply Crop & Continue →" : "Skip Crop →"}
        </Btn>
      </div>
    </div>
  );
}

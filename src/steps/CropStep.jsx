import { useCallback, useEffect, useRef, useState } from "react";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import { num } from "../utils/imageUtils.js";

function Sec({ children, icon }) {
  return <h3 className="text-lg font-headline font-bold text-on-surface mb-4 flex items-center gap-2">{icon && <span className="text-xl">{icon}</span>}{children}</h3>;
}

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
  const [history, setHistory] = useState([]);
  const RATIOS = [
    { l: "Free", v: "free" },
    { l: "1:1", v: 1 },
    { l: "4:3", v: 4 / 3 },
    { l: "16:9", v: 16 / 9 },
    { l: "3:2", v: 3 / 2 },
  ];

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

  const beginDrag = (e) => {
    if (!cropEnabled) return;
    const pos = toImgCoords(e);
    setHistory((h) => [...h, { ...crop }]);
    setDragging(true);
    setDragStart(pos);
    setCrop({ x: Math.round(pos.x), y: Math.round(pos.y), w: 0, h: 0 });
  };

  const moveDrag = (e) => {
    if (!dragging || !dragStart) return;
    const pos = toImgCoords(e);
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
      <Card style={{ marginBottom: 14 }}>
        <Sec>✂️ Crop Tool</Sec>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--c-navy)" }}>
            <input type="checkbox" checked={cropEnabled} onChange={(e) => setCropEnabled(e.target.checked)} />
            Enable Crop
          </label>
          {cropEnabled && (
            <>
              <span style={{ color: "var(--c-lb)" }}>|</span>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "var(--c-muted)" }}>
              X
              <input type="number" value={crop.x} min={0} max={image.w - 1} onChange={(e) => setCrop((c) => ({ ...c, x: Math.min(Math.max(0, num(e.target.value, 0)), image.w - c.w) }))} style={{ width: "100%", padding: "6px", border: "1px solid var(--c-lb)", borderRadius: 6 }} />
            </label>
            <label style={{ fontSize: 11, color: "var(--c-muted)" }}>
              Y
              <input type="number" value={crop.y} min={0} max={image.h - 1} onChange={(e) => setCrop((c) => ({ ...c, y: Math.min(Math.max(0, num(e.target.value, 0)), image.h - c.h) }))} style={{ width: "100%", padding: "6px", border: "1px solid var(--c-lb)", borderRadius: 6 }} />
            </label>
            <label style={{ fontSize: 11, color: "var(--c-muted)" }}>
              Width
              <input type="number" value={crop.w} min={1} max={image.w} onChange={(e) => setCrop((c) => ({ ...c, w: Math.min(Math.max(1, num(e.target.value, 1)), image.w - c.x) }))} style={{ width: "100%", padding: "6px", border: "1px solid var(--c-lb)", borderRadius: 6 }} />
            </label>
            <label style={{ fontSize: 11, color: "var(--c-muted)" }}>
              Height
              <input type="number" value={crop.h} min={1} max={image.h} onChange={(e) => setCrop((c) => ({ ...c, h: Math.min(Math.max(1, num(e.target.value, 1)), image.h - c.y) }))} style={{ width: "100%", padding: "6px", border: "1px solid var(--c-lb)", borderRadius: 6 }} />
            </label>
          </div>
        )}
        <div style={{ background: "var(--c-gray)", borderRadius: 8, overflow: "hidden", display: "flex", justifyContent: "center" }}>
          <canvas
            ref={canvasRef}
            width={Math.min(600, image.w)}
            height={Math.round(Math.min(600, image.w) * image.h / image.w)}
            style={{ maxWidth: "100%", cursor: cropEnabled ? "crosshair" : "default", display: "block", touchAction: "none" }}
            onPointerDown={beginDrag}
            onPointerMove={moveDrag}
          />
        </div>
      </Card>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={onBack} variant="secondary">
          ← Back
        </Btn>
        <Btn onClick={() => onNext(cropEnabled && crop.w >= 10 && crop.h >= 10 ? crop : null)} disabled={cropEnabled && !validCrop && crop.w > 0} style={{ flex: 1 }}>
          {cropEnabled && crop.w >= 10 ? "Apply Crop & Continue →" : "Skip Crop →"}
        </Btn>
      </div>
    </div>
  );
}

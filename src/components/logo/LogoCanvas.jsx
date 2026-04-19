import { useEffect, useRef } from "react";
import { fabric } from "fabric";

fabric.Object.prototype.objectCaching = true;

export default function LogoCanvas({
  canvasWidth,
  canvasHeight,
  zoom,
  gridVisible,
  gridSize,
  gridColor,
  snapToGrid,
  isPreview,
  onReady,
  onSelectionChange,
  onModified,
  onObjectCountChange,
  onFileDrop,
  onZoomChange,
  onZoomFit,
}) {
  const canvasElRef = useRef(null);
  const canvasRef = useRef(null);
  const mountedRef = useRef(false);
  const initialSizeRef = useRef({ width: canvasWidth, height: canvasHeight });
  const onReadyRef = useRef(onReady);
  const propsRef = useRef({
    onSelectionChange,
    onModified,
    onObjectCountChange,
    snapToGrid,
    gridSize,
  });

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    propsRef.current = {
      onSelectionChange,
      onModified,
      onObjectCountChange,
      snapToGrid,
      gridSize,
    };
  }, [onSelectionChange, onModified, onObjectCountChange, snapToGrid, gridSize]);

  useEffect(() => {
    if (mountedRef.current) return undefined;
    mountedRef.current = true;
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: initialSizeRef.current.width,
      height: initialSizeRef.current.height,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
    });
    canvasRef.current = canvas;
    onReadyRef.current?.(canvas);

    const updateSelection = () => {
      const active = canvas.getActiveObject() || null;
      propsRef.current.onSelectionChange?.(active);
    };

    const updateStats = () => {
      propsRef.current.onModified?.();
      propsRef.current.onObjectCountChange?.(canvas.getObjects().length);
    };

    const onMove = (event) => {
      const { snapToGrid: snap, gridSize: size } = propsRef.current;
      if (!snap || !event.target) return;
      event.target.set({
        left: Math.round((event.target.left || 0) / size) * size,
        top: Math.round((event.target.top || 0) / size) * size,
      });
    };

    canvas.on("selection:created", updateSelection);
    canvas.on("selection:updated", updateSelection);
    canvas.on("selection:cleared", updateSelection);
    canvas.on("object:added", updateStats);
    canvas.on("object:modified", updateStats);
    canvas.on("object:removed", updateStats);
    canvas.on("object:moving", onMove);

    return () => {
      mountedRef.current = false;
      canvas.off("selection:created", updateSelection);
      canvas.off("selection:updated", updateSelection);
      canvas.off("selection:cleared", updateSelection);
      canvas.off("object:added", updateStats);
      canvas.off("object:modified", updateStats);
      canvas.off("object:removed", updateStats);
      canvas.off("object:moving", onMove);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setDimensions({ width: Math.max(1, Math.round(canvasWidth * zoom)), height: Math.max(1, Math.round(canvasHeight * zoom)) });
    canvas.setZoom(zoom);
    canvas.requestRenderAll();
  }, [canvasWidth, canvasHeight, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.selection = !isPreview;
    canvas.forEachObject((obj) => {
      obj.selectable = !isPreview && !obj.lockMovementX;
      obj.evented = !isPreview;
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [isPreview]);

  useEffect(() => {
    const canvasEl = canvasElRef.current;
    if (!canvasEl) return undefined;

    const preventWheelZoom = (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    const preventPinchZoom = (event) => {
      if (event.touches && event.touches.length >= 2) {
        event.preventDefault();
      }
    };

    canvasEl.addEventListener("wheel", preventWheelZoom, { passive: false });
    canvasEl.addEventListener("touchmove", preventPinchZoom, { passive: false });

    return () => {
      canvasEl.removeEventListener("wheel", preventWheelZoom);
      canvasEl.removeEventListener("touchmove", preventPinchZoom);
    };
  }, []);

  return (
    <div
      className="relative flex-1 overflow-auto"
      style={{ backgroundColor: "var(--logo-bg)" }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer?.files || []);
        if (files.length) onFileDrop?.(files, { x: event.clientX, y: event.clientY });
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 0.7px, transparent 0.7px)", backgroundSize: "18px 18px" }} />

      <div className="min-h-full min-w-full p-6">
        <div className="relative mx-auto" style={{ width: Math.max(1, Math.round(canvasWidth * zoom)), height: Math.max(1, Math.round(canvasHeight * zoom)) }}>
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-6 -translate-y-full rounded-t-lg border border-b-0" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(18,19,23,0.9)" }}>
            <div className="flex h-full items-center justify-between px-3 text-[10px] tracking-[0.08em] text-[var(--logo-muted)]">
              <span>0</span>
              <span>{Math.round(canvasWidth / 2)}</span>
              <span>{canvasWidth}</span>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-6 -translate-x-full rounded-l-lg border border-r-0" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(18,19,23,0.9)" }}>
            <div className="flex h-full flex-col items-center justify-between py-3 text-[10px] tracking-[0.08em] text-[var(--logo-muted)]">
              <span>0</span>
              <span>{Math.round(canvasHeight / 2)}</span>
              <span>{canvasHeight}</span>
            </div>
          </div>

          {gridVisible && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent ${gridSize - 1}px, ${gridColor} ${gridSize}px), repeating-linear-gradient(90deg, transparent, transparent ${gridSize - 1}px, ${gridColor} ${gridSize}px)`,
              }}
            />
          )}

          <div className="absolute left-3 top-3 z-10 rounded-full border px-3 py-1 text-[11px] font-semibold text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(0,0,0,0.55)" }}>
            {canvasWidth} x {canvasHeight}
          </div>

          <canvas id="logo-canvas" ref={canvasElRef} className="rounded-md border shadow-card-sm" style={{ borderColor: "var(--logo-border)", backgroundColor: "#ffffff" }} />

          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-xl border p-2" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(17,18,22,0.85)", backdropFilter: "blur(10px)" }}>
            <button type="button" aria-label="Zoom out" className="logo-press rounded-lg border px-2 py-1 text-sm text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onZoomChange?.(zoom - 0.1)}>-</button>
            <button type="button" aria-label="Fit canvas" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onZoomFit?.()}>Fit</button>
            <button type="button" aria-label="Zoom in" className="logo-press rounded-lg border px-2 py-1 text-sm text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onZoomChange?.(zoom + 0.1)}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}

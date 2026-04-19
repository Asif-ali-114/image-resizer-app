import { useEffect, useMemo, useRef, useState } from "react";
import Btn from "./Btn.jsx";
import { blobRegistry } from "../utils/BlobRegistry.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseBytes(value) {
  if (typeof value === "number") return value;
  return null;
}

function formatDiff(before, after) {
  if (!before || !after) return { label: "≈ same", tone: "bg-slate-500" };
  const delta = ((after - before) / before) * 100;
  if (Math.abs(delta) <= 2) return { label: "≈ same", tone: "bg-slate-500" };
  if (delta < 0) return { label: `↓ ${Math.abs(delta).toFixed(0)}% smaller`, tone: "bg-emerald-500" };
  return { label: `↑ ${Math.abs(delta).toFixed(0)}% larger`, tone: "bg-amber-500" };
}

export default function ComparisonSlider({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  beforeSize,
  afterSize,
  defaultPosition = 50,
  orientation = "horizontal",
  beforeInfo = "",
  afterInfo = "",
}) {
  const containerRef = useRef(null);
  const beforeTagRef = useRef(`comparison-before-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const afterTagRef = useRef(`comparison-after-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState(orientation);
  const [aspect, setAspect] = useState(16 / 9);
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(false);
  const [isMobile, setIsMobile] = useState(() => globalThis.innerWidth < 640);

  useEffect(() => {
    const tag = beforeTagRef.current;
    blobRegistry.replaceUrl(tag, before);
    return () => blobRegistry.release(tag);
  }, [before]);

  useEffect(() => {
    const tag = afterTagRef.current;
    blobRegistry.replaceUrl(tag, after);
    return () => blobRegistry.release(tag);
  }, [after]);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 640);
      const width = containerRef.current?.getBoundingClientRect()?.width || 0;
      setCompact(width > 0 && width < 200);
      if (window.innerWidth < 640) setMode("horizontal");
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let active = true;
    setReady(false);
    const loadDimensions = async () => {
      const [a, b] = await Promise.all([
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve({ w: image.naturalWidth, h: image.naturalHeight });
          image.onerror = () => resolve({ w: 16, h: 9 });
          image.src = before;
        }),
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve({ w: image.naturalWidth, h: image.naturalHeight });
          image.onerror = () => resolve({ w: 16, h: 9 });
          image.src = after;
        }),
      ]);

      if (!active) return;
      const maxW = Math.max(a.w, b.w, 1);
      const maxH = Math.max(a.h, b.h, 1);
      setAspect(maxW / maxH);
      setReady(true);
    };

    loadDimensions();

    return () => {
      active = false;
    };
  }, [before, after]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onEsc = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsFullscreen(false);
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isFullscreen]);

  const updatePositionFromEvent = (event) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (mode === "horizontal") {
      const x = event.clientX - rect.left;
      setPosition(clamp((x / rect.width) * 100, 0, 100));
    } else {
      const y = event.clientY - rect.top;
      setPosition(clamp((y / rect.height) * 100, 0, 100));
    }
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    setIsDragging(true);
    updatePositionFromEvent(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDragging) return;
    event.preventDefault();
    updatePositionFromEvent(event);
  };

  const handlePointerUp = (event) => {
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event) => {
    const step = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setPosition((value) => clamp(value - step, 0, 100));
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setPosition((value) => clamp(value + step, 0, 100));
    }
    if (event.key === "Home") {
      event.preventDefault();
      setPosition(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      setPosition(100);
    }
    if ((event.key === "o" || event.key === "O") && !isMobile) {
      event.preventDefault();
      setMode((value) => (value === "horizontal" ? "vertical" : "horizontal"));
    }
    if (event.key === "f" || event.key === "F") {
      event.preventDefault();
      setIsFullscreen((value) => !value);
    }
  };

  const clipPath = mode === "horizontal"
    ? `inset(0 ${100 - position}% 0 0)`
    : `inset(0 0 ${100 - position}% 0)`;

  const dividerStyle = mode === "horizontal"
    ? {
        left: `${position}%`,
        top: 0,
        width: "2px",
        height: "100%",
        transform: "translateX(-50%)",
      }
    : {
        top: `${position}%`,
        left: 0,
        height: "2px",
        width: "100%",
        transform: "translateY(-50%)",
      };

  const handleStyle = mode === "horizontal"
    ? {
        left: `${position}%`,
        top: "50%",
        transform: "translate(-50%, -50%)",
        cursor: "ew-resize",
      }
    : {
        left: "50%",
        top: `${position}%`,
        transform: "translate(-50%, -50%)",
        cursor: "ns-resize",
      };

  const beforeBytes = parseBytes(beforeSize);
  const afterBytes = parseBytes(afterSize);
  const diff = useMemo(() => formatDiff(beforeBytes, afterBytes), [beforeBytes, afterBytes]);

  const slider = (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container"
      style={{ aspectRatio: aspect, userSelect: "none", touchAction: "none", minWidth: 200 }}
    >
      {!ready && <div className="absolute inset-0 animate-pulse bg-surface-container-high" />}

      <img
        src={before}
        alt={beforeLabel}
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      <img
        src={after}
        alt={afterLabel}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ clipPath }}
        draggable={false}
      />

      <div className="pointer-events-none absolute bg-white/90" style={dividerStyle} />

      <div
        role="slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Comparison divider"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="absolute z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/90 bg-white text-xs font-bold text-slate-700 shadow-lg"
        style={handleStyle}
      >
        {mode === "horizontal" ? "◄►" : "▲▼"}
      </div>

      {!compact && (
        <>
          <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
            {beforeLabel}{beforeInfo ? ` · ${beforeInfo}` : ""}
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
            <span>{afterLabel}{afterInfo ? ` · ${afterInfo}` : ""}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] text-white ${diff.tone}`}>{diff.label}</span>
          </div>
        </>
      )}

      <div className="absolute bottom-3 right-3 flex gap-2">
        {!isMobile && (
          <Btn
            small
            variant="secondary"
            onClick={() => setMode((value) => (value === "horizontal" ? "vertical" : "horizontal"))}
            aria-label="Toggle comparison orientation"
          >
            {mode === "horizontal" ? "⇅" : "⇄"}
          </Btn>
        )}
        <Btn small variant="secondary" onClick={() => setIsFullscreen(true)} aria-label="Open comparison fullscreen">⤢</Btn>
      </div>
    </div>
  );

  if (!isFullscreen) return slider;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4">
      <div className="h-[90vh] w-[90vw] max-w-[1200px]">
        {slider}
      </div>
      <Btn
        variant="secondary"
        onClick={() => setIsFullscreen(false)}
        aria-label="Close fullscreen"
        className="absolute right-4 top-4"
      >
        Close
      </Btn>
    </div>
  );
}

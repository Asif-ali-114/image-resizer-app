import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import JSZip from "jszip";
import { processSingleImage, processBulkImages, downloadBlob } from "./imagePipeline.js";

const PRESETS = {
  Instagram: [
    { name: "Post (Square)", w: 1080, h: 1080, fmt: "JPG" },
    { name: "Story / Reel", w: 1080, h: 1920, fmt: "JPG" },
    { name: "Profile Photo", w: 320, h: 320, fmt: "JPG" },
  ],
  TikTok: [
    { name: "Video Cover", w: 1080, h: 1920, fmt: "JPG" },
    { name: "Profile Photo", w: 200, h: 200, fmt: "JPG" },
  ],
  YouTube: [
    { name: "Channel Banner", w: 2560, h: 1440, fmt: "PNG" },
    { name: "Thumbnail", w: 1280, h: 720, fmt: "JPG" },
  ],
  LinkedIn: [
    { name: "Cover Photo", w: 1584, h: 396, fmt: "JPG" },
    { name: "Post Image", w: 1200, h: 627, fmt: "JPG" },
  ],
  "Twitter/X": [
    { name: "Header Photo", w: 1500, h: 500, fmt: "JPG" },
    { name: "Post Image", w: 1200, h: 675, fmt: "JPG" },
  ],
  Pinterest: [{ name: "Standard Pin", w: 1000, h: 1500, fmt: "JPG" }],
  Facebook: [{ name: "Cover Photo", w: 820, h: 312, fmt: "JPG" }],
  Shopify: [{ name: "Product Image", w: 2048, h: 2048, fmt: "JPG" }],
  Etsy: [{ name: "Product Listing", w: 2000, h: 2000, fmt: "JPG" }],
  Amazon: [{ name: "Product Main", w: 2000, h: 2000, fmt: "JPG" }],
  WhatsApp: [{ name: "Profile Photo", w: 500, h: 500, fmt: "JPG" }],
};

const ICONS = {
  Instagram: "📸",
  TikTok: "🎵",
  YouTube: "▶️",
  LinkedIn: "💼",
  "Twitter/X": "𝕏",
  Pinterest: "📌",
  Facebook: "👥",
  Shopify: "🛍️",
  Etsy: "🏺",
  Amazon: "📦",
  WhatsApp: "💬",
};

const SIZE_PRESETS = [
  { label: "Email-ready", target: 500 },
  { label: "Web-optimized", target: 200 },
  { label: "WhatsApp", target: 5000 },
];

const C = {
  navy: "var(--c-navy)",
  blue: "var(--c-blue)",
  lb: "var(--c-lb)",
  accent: "var(--c-accent)",
  text: "var(--c-text)",
  muted: "var(--c-muted)",
  bg: "var(--c-bg)",
  success: "var(--c-success)",
  warn: "var(--c-warn)",
  danger: "var(--c-danger)",
  white: "var(--c-white)",
  gray: "var(--c-gray)",
};

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"];
const FORMAT_MIME = { JPG: "image/jpeg", PNG: "image/png", WebP: "image/webp" };
const LOCAL_STORAGE_SETTINGS_KEY = "irp_last_settings_v1";
const LOCAL_STORAGE_THEME_KEY = "irp_theme_v1";

function num(v, min = 1) {
  const parsed = Number.parseInt(v, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.max(min, parsed);
}

function drawHighQuality(sourceCanvas, targetW, targetH) {
  let current = sourceCanvas;
  while (current.width * 0.5 > targetW && current.height * 0.5 > targetH) {
    const half = document.createElement("canvas");
    half.width = Math.max(targetW, Math.floor(current.width * 0.5));
    half.height = Math.max(targetH, Math.floor(current.height * 0.5));
    const hctx = half.getContext("2d");
    hctx.imageSmoothingEnabled = true;
    hctx.imageSmoothingQuality = "high";
    hctx.drawImage(current, 0, 0, half.width, half.height);
    current = half;
  }

  if (current.width !== targetW || current.height !== targetH) {
    const out = document.createElement("canvas");
    out.width = targetW;
    out.height = targetH;
    const octx = out.getContext("2d");
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(current, 0, 0, targetW, targetH);
    return out;
  }

  return current;
}

function bytesToText(bytes) {
  if (!bytes) return "-";
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function dataUrlBytes(dataUrl) {
  return Math.round((dataUrl.split(",")[1].length * 3) / 4);
}

function downloadDataUrl(filename, dataUrl) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function waitForAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

function readMagicBytes(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = () => reject(new Error("Unable to inspect file"));
    reader.readAsArrayBuffer(file.slice(0, 16));
  });
}

function magicTypeFromHeader(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

async function validateImageFile(file, { maxBytes = 20 * 1024 * 1024 } = {}) {
  if (!file) return { ok: false, message: "Missing file." };
  if (file.size === 0) return { ok: false, message: "File appears to be empty." };
  if (file.size > maxBytes) return { ok: false, message: "File exceeds 20MB limit." };
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return { ok: false, message: "Format not supported. Accepted: JPG, PNG, WebP, GIF, BMP, TIFF" };
  }

  if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    const header = await readMagicBytes(file);
    const magicType = magicTypeFromHeader(header);
    if (!magicType || magicType !== file.type) {
      return { ok: false, message: "File signature does not match MIME type." };
    }
  }

  return { ok: true };
}

function Btn({ children, onClick, disabled, variant = "primary", size = "md", small = false, className = "", style, ...rest }) {
  const baseClasses = "font-bold transition-all duration-200 rounded-lg font-headline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base",
  };
  
  const variantClasses = {
    primary: "bg-primary text-on-primary hover:bg-primary-dim shadow-sm hover:shadow-md",
    secondary: "bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container transition-colors",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    danger: "bg-error/10 text-error border border-error/20 hover:bg-error/20",
    ghost: "text-primary hover:bg-primary/5 border border-outline-variant/30",
  };
  
  const resolvedSize = small ? "sm" : size;
  const cls = `${baseClasses} ${sizeClasses[resolvedSize] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`;
  
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cls}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "", style }) {
  return (
    <div className={`bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6 ${className}`} style={style}>
      {children}
    </div>
  );
}

function Sec({ children, icon }) {
  return <h3 className="text-lg font-headline font-bold text-on-surface mb-4 flex items-center gap-2">{icon && <span className="text-xl">{icon}</span>}{children}</h3>;
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return (
    <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-lg text-error text-sm font-medium flex items-start gap-3">
      <span className="text-lg mt-0.5">⚠</span>
      <span>{msg}</span>
    </div>
  );
}

function WarnBox({ msg }) {
  if (!msg) return null;
  return (
    <div className="mt-4 p-4 bg-warn/10 border border-warn/30 rounded-lg text-warn text-sm font-medium flex items-start gap-3">
      <span className="text-lg mt-0.5">!</span>
      <span>{msg}</span>
    </div>
  );
}

function StepBar({ current, onGoStep }) {
  const steps = ["Upload", "Resize", "Crop", "Output"];
  return (
    <div className="flex items-center gap-2 md:gap-3 mb-8 md:mb-12 px-2 md:px-0 overflow-x-auto pb-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-shrink-0">
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (i < current) onGoStep(i);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                i < current
                  ? "bg-primary text-on-primary cursor-pointer hover:bg-primary-dim"
                  : i === current
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
              aria-label={`Step ${i + 1} ${s}`}
            >
              {i < current ? "✓" : i + 1}
            </button>
            <span className={`text-xs font-medium whitespace-nowrap ${i === current ? "text-primary font-bold" : "text-on-surface-variant"}`}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-1 mx-1 md:mx-2 transition-colors duration-300 flex-grow ${
                i < current ? "bg-primary" : "bg-surface-container"
              }`}
              style={{ minWidth: "12px", maxWidth: "60px" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function UploadStep({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    };
  }, [thumbUrl]);

  const processFile = async (file) => {
    setError("");
    if (!file) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    try {
      const valid = await validateImageFile(file);
      if (!valid.ok) {
        setError(valid.message);
        return;
      }

      const url = URL.createObjectURL(file);
      const img = await loadImageFromUrl(url);
      if (img.width > 8000 || img.height > 8000) {
        URL.revokeObjectURL(url);
        setError("Resolution exceeds 8000x8000px limit.");
        return;
      }

      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
      setThumbUrl(url);
      onUpload({ file, url, w: img.width, h: img.height, size: file.size, name: file.name, type: file.type });
    } catch {
      setError("Could not read image. File may be corrupt.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onPaste = useCallback(
    (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          processFile(item.getAsFile());
          break;
        }
      }
    },
    [processFile]
  );

  useEffect(() => {
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [onPaste]);

  return (
    <div className="w-full max-w-2xl mx-auto px-2 md:px-0">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          processFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 ${
          dragging
            ? "border-primary bg-primary/5 scale-105"
            : "border-primary bg-primary/2 hover:border-primary/80 hover:bg-primary/3"
        }`}
      >
        <div className="text-5xl md:text-6xl mb-4">🖼️</div>
        <h2 className="text-xl md:text-2xl font-headline font-bold text-on-surface mb-2">Drop your image here</h2>
        <p className="text-on-surface-variant text-sm md:text-base mb-6">
          or click to browse · paste with <kbd className="px-2 py-1 bg-surface-container rounded text-xs font-mono">Ctrl+V</kbd>
        </p>
        <div className="inline-block px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary-dim transition-colors">
          Choose File
        </div>
        <p className="text-on-surface-variant text-xs md:text-sm mt-6">
          JPG · PNG · WebP · GIF · BMP · TIFF · Max 20MB · Max 8000x8000px
        </p>
      </div>

      {thumbUrl && (
        <div className="mt-8 flex justify-center">
          <div className="relative group">
            <img
              src={thumbUrl}
              alt="Selected preview"
              className="max-w-xs md:max-w-sm max-h-64 rounded-lg shadow-lg border border-outline-variant/30 group-hover:shadow-xl transition-shadow"
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}

      <ErrBox msg={error} />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => processFile(e.target.files[0])}
      />

      <div className="mt-6 md:mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-on-surface-variant">
        <strong className="text-primary">⌨ Shortcuts:</strong> Ctrl+V paste · Tab navigate · Enter confirm
      </div>
    </div>
  );
}

function ResizeStep({ image, onNext, onBack }) {
  const saved = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY) || "{}");
    } catch {
      return {};
    }
  }, []);

  const [mode, setMode] = useState("pixel");
  const [width, setWidth] = useState(image.w);
  const [height, setHeight] = useState(image.h);
  const [pct, setPct] = useState(100);
  const [lock, setLock] = useState(true);
  const [format, setFormat] = useState(saved.format || "JPG");
  const [quality, setQuality] = useState(saved.quality || 85);
  const [jpgBackground, setJpgBackground] = useState(saved.jpgBackground || "#ffffff");
  const [sizeMode, setSizeMode] = useState("quality");
  const [targetKB, setTargetKB] = useState(200);
  const [activePlatform, setActivePlatform] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [error, setError] = useState("");
  const [warn, setWarn] = useState("");

  const effW = mode === "percent" ? Math.round((image.w * pct) / 100) : width;
  const effH = mode === "percent" ? Math.round((image.h * pct) / 100) : height;
  const qualityMultiplier = format === "PNG" ? 1 : quality / 100;
  const estKB = Math.round((image.size * (effW * effH)) / (image.w * image.h) * qualityMultiplier / 1024);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify({ format, quality, jpgBackground }));
  }, [format, quality, jpgBackground]);

  const setW = (v) => {
    const w = Math.max(1, parseInt(v, 10) || 1);
    setWidth(w);
    if (lock) setHeight(Math.round((w * image.h) / image.w));
    setActivePreset(null);
  };

  const setH = (v) => {
    const h = Math.max(1, parseInt(v, 10) || 1);
    setHeight(h);
    if (lock) setWidth(Math.round((h * image.w) / image.h));
    setActivePreset(null);
  };

  const setFmt = (f) => {
    setFormat(f);
    setWarn(
      f === "JPG" && image.type === "image/png"
        ? "Transparent PNG to JPG: alpha will be filled with selected background color."
        : f === "JPG" && image.type === "image/gif"
          ? "Animated GIF to JPG: only the first frame will be used."
          : ""
    );
  };

  const applyPreset = (p) => {
    setMode("pixel");
    setWidth(p.w);
    setHeight(p.h);
    setFmt(p.fmt);
    setLock(true);
    setActivePreset(p.name);
  };

  const validate = () => {
    if (effW < 10 || effH < 10) {
      setError("Minimum output size is 10x10px.");
      return false;
    }
    if (effW > image.w * 3 || effH > image.h * 3) {
      setError(`Max upscale is 3x (${image.w * 3}x${image.h * 3}px).`);
      return false;
    }
    setError("");
    return true;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full">
      {/* Main Content Column */}
      <div className="lg:col-span-2 space-y-4 md:space-y-6">
        <Card style={{ marginBottom: 14 }}>
          <Sec>📐 Dimensions</Sec>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["pixel", "percent"].map((m) => (
              <Btn key={m} onClick={() => setMode(m)} variant={mode === m ? "primary" : "ghost"} small>
                {m === "pixel" ? "Pixels (px)" : "Scale (%)"}
              </Btn>
            ))}
          </div>
          {mode === "pixel" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Width (px)</label>
                <input type="number" value={width} min={10} onChange={(e) => setW(e.target.value)} style={{ width: 96, padding: "7px 10px", border: `1px solid ${C.blue}`, borderRadius: 6, fontSize: 14 }} />
              </div>
              <button
                onClick={() => setLock(!lock)}
                title={lock ? "Locked" : "Unlocked"}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: `2px solid ${C.blue}`,
                  background: lock ? C.navy : C.white,
                  color: lock ? C.white : C.blue,
                  cursor: "pointer",
                  fontSize: 14,
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {lock ? "🔒" : "🔓"}
              </button>
              <div>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Height (px)</label>
                <input type="number" value={height} min={10} onChange={(e) => setH(e.target.value)} style={{ width: 96, padding: "7px 10px", border: `1px solid ${C.blue}`, borderRadius: 6, fontSize: 14 }} />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ fontSize: 11, color: C.muted }}>Scale</label>
                <strong style={{ fontSize: 12, color: C.navy }}>
                  {pct}%  →  {effW}x{effH}px
                </strong>
              </div>
              <input type="range" min={1} max={300} value={pct} onChange={(e) => setPct(+e.target.value)} style={{ width: "100%", accentColor: C.navy }} />
            </div>
          )}
          <p style={{ fontSize: 11, color: C.muted, marginTop: 8, marginBottom: 0 }}>
            Original: {image.w}x{image.h}px · Max 3x: {image.w * 3}x{image.h * 3}px
          </p>
          <div style={{ marginTop: 10 }}>
            <img src={image.url} alt="Resize source" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8, border: `1px solid ${C.lb}` }} />
          </div>
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <Sec>🎨 Format & Compression</Sec>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {["JPG", "PNG", "WebP"].map((f) => (
              <Btn key={f} onClick={() => setFmt(f)} variant={format === f ? "primary" : "ghost"} small>
                {f}
              </Btn>
            ))}
          </div>
          <WarnBox msg={warn} />

          {format === "JPG" && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>JPG Background Fill</label>
              <input type="color" value={jpgBackground} onChange={(e) => setJpgBackground(e.target.value)} style={{ width: 60, height: 34, border: `1px solid ${C.lb}`, borderRadius: 6, background: C.white }} />
            </div>
          )}

          {format !== "PNG" ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {["quality", "target"].map((m) => (
                  <Btn key={m} onClick={() => setSizeMode(m)} variant={sizeMode === m ? "primary" : "ghost"} small>
                    {m === "quality" ? "Quality %" : "Target Size"}
                  </Btn>
                ))}
              </div>
              {sizeMode === "quality" ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <label style={{ fontSize: 11, color: C.muted }}>Quality</label>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{quality}%</span>
                  </div>
                  <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} style={{ width: "100%", accentColor: C.navy }} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11 }}>
                    <span style={{ color: C.muted }}>Smaller file</span>
                    <span style={{ color: C.muted }}>Est. ~{estKB} KB</span>
                    <span style={{ color: C.muted }}>Better quality</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    {SIZE_PRESETS.map((p) => (
                      <Btn key={p.label} onClick={() => setTargetKB(p.target)} variant={targetKB === p.target ? "primary" : "ghost"} small>
                        {p.label} (&lt;{p.target}KB)
                      </Btn>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 11, color: C.muted }}>Custom:</label>
                    <input type="number" value={targetKB} onChange={(e) => setTargetKB(+e.target.value)} min={10} style={{ width: 70, padding: "6px 8px", border: `1px solid ${C.blue}`, borderRadius: 6, fontSize: 13 }} />
                    <span style={{ fontSize: 11, color: C.muted }}>KB (±5% accuracy)</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: C.muted, marginTop: 8, marginBottom: 0 }}>PNG is always lossless.</p>
          )}
        </Card>

        <ErrBox msg={error} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Btn onClick={onBack} variant="secondary">
            ← Back
          </Btn>
          <Btn
            onClick={() => {
              if (validate()) onNext({ width: effW, height: effH, format, quality, sizeMode, targetKB, jpgBackground });
            }}
            style={{ flex: 1 }}
          >
            Next: Crop →
          </Btn>
        </div>
      </div>

      <div style={{ background: C.bg, border: `1px solid ${C.lb}`, borderRadius: 12, padding: 12, overflowY: "auto", maxHeight: 560 }}>
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.06em" }}>Platform Presets</p>
        {Object.entries(PRESETS).map(([pl, list]) => (
          <div key={pl} style={{ marginBottom: 2 }}>
            <button
              onClick={() => setActivePlatform(activePlatform === pl ? null : pl)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "6px 8px",
                background: activePlatform === pl ? C.lb : "transparent",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: C.navy,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                {ICONS[pl]} {pl}
              </span>
              <span style={{ color: C.blue, fontSize: 9 }}>{activePlatform === pl ? "▲" : "▼"}</span>
            </button>
            {activePlatform === pl &&
              list.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "4px 8px 4px 18px",
                    background: activePreset === p.name ? C.navy : "transparent",
                    border: "none",
                    borderRadius: 5,
                    cursor: "pointer",
                    fontSize: 11,
                    color: activePreset === p.name ? C.white : C.text,
                    marginBottom: 1,
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 10, opacity: 0.65 }}>
                    {p.w}x{p.h} · {p.fmt}
                  </div>
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CropStep({ image, onNext, onBack }) {
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
      ctx.strokeStyle = C.blue;
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
          <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.navy }}>
            <input type="checkbox" checked={cropEnabled} onChange={(e) => setCropEnabled(e.target.checked)} />
            Enable Crop
          </label>
          {cropEnabled && (
            <>
              <span style={{ color: C.lb }}>|</span>
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
            <label style={{ fontSize: 11, color: C.muted }}>
              X
              <input type="number" value={crop.x} min={0} max={image.w - 1} onChange={(e) => setCrop((c) => ({ ...c, x: Math.min(Math.max(0, num(e.target.value, 0)), image.w - c.w) }))} style={{ width: "100%", padding: "6px", border: `1px solid ${C.lb}`, borderRadius: 6 }} />
            </label>
            <label style={{ fontSize: 11, color: C.muted }}>
              Y
              <input type="number" value={crop.y} min={0} max={image.h - 1} onChange={(e) => setCrop((c) => ({ ...c, y: Math.min(Math.max(0, num(e.target.value, 0)), image.h - c.h) }))} style={{ width: "100%", padding: "6px", border: `1px solid ${C.lb}`, borderRadius: 6 }} />
            </label>
            <label style={{ fontSize: 11, color: C.muted }}>
              Width
              <input type="number" value={crop.w} min={1} max={image.w} onChange={(e) => setCrop((c) => ({ ...c, w: Math.min(Math.max(1, num(e.target.value, 1)), image.w - c.x) }))} style={{ width: "100%", padding: "6px", border: `1px solid ${C.lb}`, borderRadius: 6 }} />
            </label>
            <label style={{ fontSize: 11, color: C.muted }}>
              Height
              <input type="number" value={crop.h} min={1} max={image.h} onChange={(e) => setCrop((c) => ({ ...c, h: Math.min(Math.max(1, num(e.target.value, 1)), image.h - c.y) }))} style={{ width: "100%", padding: "6px", border: `1px solid ${C.lb}`, borderRadius: 6 }} />
            </label>
          </div>
        )}
        <div style={{ background: C.gray, borderRadius: 8, overflow: "hidden", display: "flex", justifyContent: "center" }}>
          <canvas
            ref={canvasRef}
            width={Math.min(600, image.w)}
            height={Math.round(Math.min(600, image.w) * image.h / image.w)}
            style={{ maxWidth: "100%", cursor: cropEnabled ? "crosshair" : "default", display: "block", touchAction: "none" }}
            onMouseDown={beginDrag}
            onMouseMove={moveDrag}
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

function OutputStep({ image, settings, crop, onBack, onReset, onNotice }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());
  const [imgLoaded, setImgLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Idle");
  const [done, setDone] = useState(false);
  const [url, setUrl] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const [outBytes, setOutBytes] = useState(null);
  const [procTime, setProcTime] = useState(null);
  const [view, setView] = useState("before");

  useEffect(() => {
    imgRef.current.onload = () => {
      setImgLoaded(true);
      drawBefore();
    };
    imgRef.current.src = image.url;
  }, [image.url]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  const drawBefore = () => {
    const c = canvasRef.current;
    if (!c || !imgRef.current.complete) return;
    const ctx = c.getContext("2d");
    c.width = Math.min(580, image.w);
    c.height = Math.round((c.width * image.h) / image.w);
    ctx.drawImage(imgRef.current, 0, 0, c.width, c.height);
  };

  const drawAfter = () => {
    if (!url) return;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    const out = new Image();
    out.onload = () => {
      c.width = Math.min(580, settings.width);
      c.height = Math.round((c.width * settings.height) / settings.width);
      ctx.drawImage(out, 0, 0, c.width, c.height);
    };
    out.src = url;
  };

  useEffect(() => {
    if (view === "before") drawBefore();
    else if (view === "after" && done) drawAfter();
  }, [view, done, imgLoaded, url]);

  const process = async () => {
    if (processing) return;

    if (!imgRef.current.complete) {
      await new Promise((resolve) => {
        imgRef.current.onload = () => {
          setImgLoaded(true);
          resolve();
        };
      });
    }

    setProcessing(true);
    setProgress(0);
    setStage("Preparing source");
    setDone(false);
    const t0 = performance.now();

    try {
      const result = await processSingleImage({
        file: image.file,
        settings,
        crop,
        sourceWidth: image.w,
        sourceHeight: image.h,
        sourceUrl: image.url,
        onProgress: ({ stage: nextStage, progress: nextProgress }) => {
          setStage(nextStage);
          setProgress(nextProgress);
        },
      });

      const nextUrl = URL.createObjectURL(result.blob);
      setProgress(100);
      setStage("Done");
      setOutBytes(result.bytes);
      setOutputBlob(result.blob);
      setUrl(nextUrl);
      setProcTime(Math.round(performance.now() - t0));
      setDone(true);
      setView("after");
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!outputBlob && !url) return;
    try {
      if (navigator.clipboard && window.ClipboardItem && outputBlob) {
        await navigator.clipboard.write([new ClipboardItem({ [outputBlob.type || FORMAT_MIME[settings.format] || "image/png"]: outputBlob })]);
        onNotice?.({ type: "info", message: "Image copied to clipboard." });
      } else {
        await navigator.clipboard.writeText(url);
        onNotice?.({ type: "info", message: "Clipboard image API unavailable. Copied image link instead." });
      }
    } catch {
      onNotice?.({ type: "error", message: "Unable to access clipboard in this browser context." });
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Sec>🖼️ Preview</Sec>
          {done && (
            <div style={{ display: "flex", gap: 6 }}>
              {["before", "after"].map((v) => (
                <Btn key={v} onClick={() => setView(v)} variant={view === v ? "primary" : "ghost"} small>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Btn>
              ))}
            </div>
          )}
        </div>
        <div style={{ background: C.gray, borderRadius: 8, display: "flex", justifyContent: "center", minHeight: 160, padding: 8 }}>
          <canvas ref={canvasRef} style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 4, display: "block" }} />
        </div>
        {processing && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 4 }}>
              <span>{stage}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 7, background: C.lb, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", background: C.blue, width: `${progress}%`, borderRadius: 4, transition: "width 0.12s" }} />
            </div>
          </div>
        )}
      </Card>

      <div>
        <Card style={{ marginBottom: 12 }}>
          <Sec>⚙ Summary</Sec>
          {[ ["Dimensions", `${settings.width}x${settings.height}px`], ["Format", settings.format], ["Crop", crop ? `${crop.w}x${crop.h} @ (${crop.x},${crop.y})` : "None"] ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.accent}`, fontSize: 12 }}>
              <span style={{ color: C.muted }}>{k}</span>
              <strong style={{ color: C.navy, maxWidth: 140, textAlign: "right", wordBreak: "break-all" }}>{v}</strong>
            </div>
          ))}
        </Card>

        {done && outBytes && (
          <Card style={{ marginBottom: 12, background: "var(--c-success-card-bg)", border: "1px solid var(--c-success-card-border)" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: "0 0 3px", fontSize: 11, color: C.muted }}>Output file size</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.success }}>{bytesToText(outBytes)}</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: C.muted }}>{procTime ? `${procTime}ms` : ""}</p>
            </div>
          </Card>
        )}

        {!done && (
          <Btn onClick={process} disabled={processing} style={{ width: "100%", marginBottom: 8 }}>
            {processing ? "Processing..." : "⚡ Process Image"}
          </Btn>
        )}

        {done && (
          <>
            <Btn
              onClick={() => {
                const name = `${image.name.replace(/\.[^.]+$/, "")}_${settings.width}x${settings.height}.${settings.format.toLowerCase()}`;
                if (outputBlob) downloadBlob(name, outputBlob);
              }}
              variant="success"
              style={{ width: "100%", marginBottom: 8 }}
            >
              ⬇ Download {settings.format}
            </Btn>
            <Btn onClick={copyToClipboard} variant="secondary" style={{ width: "100%", marginBottom: 8 }}>
              Copy To Clipboard
            </Btn>
          </>
        )}

        <div style={{ display: "flex", gap: 6 }}>
          <Btn onClick={onBack} variant="secondary" style={{ flex: 1 }}>
            ← Edit
          </Btn>
          <Btn onClick={onReset} variant="secondary" style={{ flex: 1 }}>
            ↺ New
          </Btn>
        </div>
      </div>
    </div>
  );
}

async function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function BulkTab({ onNotice }) {
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
  const inputRef = useRef(null);
  const MAX = 20;
  const orderedResults = useMemo(() => [...results].sort((a, b) => a.index - b.index), [results]);
  const orderedFailed = useMemo(() => [...failed].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)), [failed]);

  const addFiles = async (list) => {
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
  };

  const processAll = async () => {
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
          setResults((current) => [
            ...current,
            {
              index: result.index,
              name: `${result.file.name.replace(/\.[^.]+$/, "")}_resized.${format.toLowerCase()}`,
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
  };

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

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        style={{ border: `2px dashed ${C.blue}`, borderRadius: 12, padding: 28, textAlign: "center", cursor: "pointer", background: C.bg, marginBottom: 18 }}
      >
        <p style={{ margin: 0, color: C.navy, fontWeight: 700, fontSize: 15 }}>
          📂 Drop up to {MAX} images
        </p>
        <p style={{ margin: "5px 0 0", color: C.muted, fontSize: 12 }}>JPG · PNG · WebP · GIF · Max 200MB total</p>
        <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
      </div>

      <Card style={{ marginBottom: 18 }}>
        <Sec>⚙ Batch Settings</Sec>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Mode</label>
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
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Width</label>
                <input type="number" value={width} onChange={(e) => setWidth(+e.target.value)} style={{ width: 76, padding: "7px 9px", border: `1px solid ${C.blue}`, borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Height</label>
                <input type="number" value={height} onChange={(e) => setHeight(+e.target.value)} style={{ width: 76, padding: "7px 9px", border: `1px solid ${C.blue}`, borderRadius: 6 }} />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Scale: {pct}%</label>
              <input type="range" min={1} max={300} value={pct} onChange={(e) => setPct(+e.target.value)} style={{ width: "100%", accentColor: C.navy }} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ padding: "7px 9px", border: `1px solid ${C.blue}`, borderRadius: 6 }}>
              {["JPG", "PNG", "WebP"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          {format !== "PNG" && (
            <div style={{ minWidth: 110 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Quality: {quality}%</label>
              <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} style={{ width: "100%", accentColor: C.navy }} />
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
              onClick={() => {
                setFiles([]);
                setProgMap({});
                setFailed([]);
                setResults([]);
              }}
              variant="ghost"
              small
            >
              Clear
            </Btn>
          </div>
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.accent}` }}>
              <span style={{ fontSize: 16 }}>🖼️</span>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 12, color: C.text, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{f.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{(f.size / 1024).toFixed(0)} KB</div>
              </div>
              {progMap[i] !== undefined ? (
                <div style={{ width: 84 }}>
                  <div style={{ height: 5, background: C.lb, borderRadius: 3 }}>
                    <div style={{ height: "100%", background: progMap[i] === 100 ? C.success : C.blue, width: `${progMap[i]}%`, borderRadius: 3, transition: "width 0.08s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2, textAlign: "right" }}>{progMap[i] === 100 ? "✓ Done" : `${progMap[i]}%`}</div>
                </div>
              ) : (
                <span style={{ fontSize: 10, color: C.muted }}>Pending</span>
              )}
            </div>
          ))}
        </Card>
      )}

      {orderedFailed.length > 0 && (
        <Card style={{ marginBottom: 18, border: `1px solid ${C.danger}` }}>
          <Sec>❌ Failed Files</Sec>
          {orderedFailed.map((f, i) => (
            <div key={`${f.name}-${i}`} style={{ fontSize: 12, color: C.danger, padding: "3px 0" }}>
              • {f.name} — {f.reason}
            </div>
          ))}
        </Card>
      )}

      {orderedResults.length > 0 && (
        <Card style={{ marginBottom: 18 }}>
          <Sec>✅ Processed Files</Sec>
          {orderedResults.map((r, i) => (
            <div key={`${r.name}-${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.accent}` }}>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 13, color: C.text, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{bytesToText(r.bytes)}</div>
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
          <Btn onClick={downloadAll} variant="success" size="lg" style={{ flex: 1, width: "100%" }}>
            ⬇ Download All Processed Files (ZIP)
          </Btn>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("single");
  const [step, setStep] = useState(0);
  const [image, setImage] = useState(null);
  const [settings, setSettings] = useState(null);
  const [cropData, setCropData] = useState(null);
  const [notice, setNotice] = useState(null);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 2800);
    return () => clearTimeout(timer);
  }, [notice]);

  const reset = useCallback(() => {
    if (image?.url) URL.revokeObjectURL(image.url);
    setStep(0);
    setImage(null);
    setSettings(null);
    setCropData(null);
  }, [image]);

  useEffect(() => {
    return () => {
      if (image?.url) URL.revokeObjectURL(image.url);
    };
  }, [image]);

  const TABS = [
    { id: "single", label: "Single Image" },
    { id: "bulk", label: "Bulk Resize" },
  ];

  const handleTabChange = (nextTab) => {
    if (nextTab === tab) return;
    if (step > 0 && tab === "single") {
      reset();
      setNotice({ type: "info", message: "Current edit was reset after switching tabs." });
    }
    setTab(nextTab);
  };

  const heroMeta = {
    single: {
      title: "Optimize for Every Canvas",
      subtitle: "Single image resizing with crop, export controls, and high-quality output.",
      badge: "v2.4",
    },
    bulk: {
      title: "Process Collections in One Pass",
      subtitle: "Drop multiple files, configure one output profile, and bundle results into a ZIP.",
      badge: "Batch Ready",
    },
  }[tab];

  const singleSummary = image
    ? [
        ["File Name", image.name],
        ["Current Size", bytesToText(image.size)],
        ["Resolution", `${image.w} × ${image.h}`],
      ]
    : [
        ["File Name", "No file selected"],
        ["Current Size", "-"],
        ["Resolution", "Upload an image to begin"],
      ];

  const stepPanel = (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <section className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card md:p-6">
          <StepBar current={step} onGoStep={(targetStep) => setStep(targetStep)} />
          {step === 0 && <UploadStep onUpload={(img) => { setImage(img); setStep(1); }} />}
          {step === 1 && image && <ResizeStep image={image} onNext={(s) => { setSettings(s); setStep(2); }} onBack={() => setStep(0)} />}
          {step === 2 && image && settings && <CropStep image={image} onNext={(c) => { setCropData(c); setStep(3); }} onBack={() => setStep(1)} />}
          {step === 3 && image && settings && <OutputStep image={image} settings={settings} crop={cropData} onBack={() => setStep(2)} onReset={reset} onNotice={setNotice} />}
        </section>

        <aside className="space-y-6">
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Live Preview</p>
                <h2
                  className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-headline text-xl font-bold text-on-surface"
                  title={image ? image.name : "Upload an image"}
                >
                  {image ? image.name : "Upload an image"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange("bulk")}
                className="shrink-0 rounded-full bg-surface-container-high px-4 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                Switch to Bulk
              </button>
            </div>

            {image ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl bg-surface-container">
                  <img src={image.url} alt="Uploaded preview" className="h-56 w-full object-contain p-3" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {singleSummary.map(([label, value]) => (
                    <div key={label} className="min-w-0 overflow-hidden rounded-2xl bg-surface-container-low p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
                      <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-on-surface" title={String(value)}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-container-low p-6 text-center">
                <div className="mb-3 text-4xl">🖼️</div>
                <p className="mx-auto max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-on-surface" title="Drop an image to start">Drop an image to start</p>
                <p className="mx-auto mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-on-surface-variant" title="The editor, cropper, and exporter activate after upload.">The editor, cropper, and exporter activate after upload.</p>
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] bg-surface-container-low p-5 shadow-card">
            <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Quick Actions</p>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-2xl bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
              >
                Reset Session
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body">
      <header className="fixed top-0 z-50 w-full bg-surface/85 shadow-nav backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-4 md:gap-8">
            <span className="font-headline text-2xl font-black tracking-tight text-primary">ImageResizerPro</span>
            <nav className="hidden items-center gap-6 md:flex">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`font-headline font-semibold tracking-tight transition-colors ${tab === item.id ? "border-b-2 border-primary pb-1 text-primary" : "text-on-surface-variant hover:text-primary"}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="rounded-full border border-outline-variant/40 bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <span className="rounded-full border border-outline-variant/30 px-5 py-2.5 text-sm font-bold text-primary">Free & Local</span>
          </div>
        </div>

        <div className="border-b border-outline-variant/10 bg-surface-container-lowest/70 px-4 md:hidden">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto py-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tab === item.id ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 md:px-8 md:pt-32">
        {notice && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${notice.type === "error" ? "border-error/40 bg-error/10 text-error" : "border-primary/30 bg-primary/10 text-on-surface"}`}>
            {notice.message}
          </div>
        )}

        <section className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-background md:text-6xl">{heroMeta.title}</h1>
            <p className="mt-4 max-w-2xl text-base text-on-surface-variant md:text-lg">{heroMeta.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-secondary-container px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-secondary-container">{heroMeta.badge}</span>
            <span className="rounded-full bg-surface-container-high px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Responsive</span>
            <span className="rounded-full bg-surface-container-high px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Local Processing</span>
          </div>
        </section>

        {tab === "single" && stepPanel}

        {tab === "bulk" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <section className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card md:p-6">
              <BulkTab onNotice={setNotice} />
            </section>
            <aside className="space-y-6">
              <div className="rounded-[1.5rem] bg-surface-container-low p-5 shadow-card">
                <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Workflow Notes</p>
                <ul className="mt-4 space-y-3 text-sm text-on-surface-variant">
                  <li>• Drag multiple files into the batch panel.</li>
                  <li>• Use one export format and quality profile for the whole queue.</li>
                  <li>• Download all processed images as a single ZIP file.</li>
                </ul>
              </div>
              <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card">
                <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Supported Formats</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {Object.keys(FORMAT_MIME).map((fmt) => (
                    <div key={fmt} className="rounded-2xl bg-surface-container-low p-4 font-semibold text-on-surface">{fmt}</div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

      </main>

      <footer className="border-t border-outline-variant/10 bg-surface-container-lowest px-4 py-5 text-center text-xs text-on-surface-variant md:px-8">
        All images are processed locally in your browser. No upload is required.
      </footer>
    </div>
  );
}

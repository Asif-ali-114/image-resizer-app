import { useEffect, useMemo, useState } from "react";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import { PRESETS, ICONS, SIZE_PRESETS } from "../constants/presets.js";
import { LOCAL_STORAGE_SETTINGS_KEY } from "../constants/formats.js";
import { sanitizeSettings } from "../utils/sanitizeSettings.js";
import { isCodecSupported } from "../utils/codecCapabilities.js";
import { iconProps, ToolLockIcon, ToolUnlockIcon } from "../components/AppIcons.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import AlertBox from "../components/AlertBox.jsx";


export default function ResizeStep({ image, onNext, onBack }) {
  const formatMap = useMemo(() => ({ JPG: "jpeg", PNG: "png", WebP: "webp" }), []);
  const supportedResizeFormats = useMemo(
    () => ["JPG", "PNG", "WebP"].filter((entry) => isCodecSupported(formatMap[entry])),
    [formatMap],
  );
  const saved = useMemo(() => {
    try {
      const normalized = sanitizeSettings(JSON.parse(localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY) || "{}"));
      return {
        quality: normalized.quality,
        format: normalized.format === "jpeg" ? "JPG" : normalized.format === "png" ? "PNG" : "WebP",
        jpgBackground: normalized.jpgBackground,
      };
    } catch {
      return {
        quality: 85,
        format: "JPG",
        jpgBackground: "#ffffff",
      };
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
  const [stripExif, setStripExif] = useState(true);
  const [sizeMode, setSizeMode] = useState("quality");
  const [targetKB, setTargetKB] = useState(200);
  const [activePlatform, setActivePlatform] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [error, setError] = useState("");
  const [warn, setWarn] = useState("");
  const [resizeMode, setResizeMode] = useState("stretch");

  useEffect(() => {
    if (!supportedResizeFormats.length) return;
    if (!supportedResizeFormats.includes(format)) {
      setFormat(supportedResizeFormats[0]);
    }
  }, [format, supportedResizeFormats]);

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
      <div className="lg:col-span-2 space-y-4 md:space-y-6">
        <Card className="mb-3.5">
          <SectionHeader>📐 Dimensions</SectionHeader>
          <div className="mb-3.5 flex gap-1.5">
            {["pixel", "percent"].map((m) => (
              <Btn key={m} onClick={() => setMode(m)} variant={mode === m ? "primary" : "ghost"} small>
                {m === "pixel" ? "Pixels (px)" : "Scale (%)"}
              </Btn>
            ))}
          </div>
          {mode === "pixel" ? (
            <div className="flex items-center gap-2.5">
              <div>
                <label className="mb-1 block text-xs text-on-surface-variant">Width (px)</label>
                <input type="number" value={width} min={10} onChange={(e) => setW(e.target.value)} className="w-24 rounded-md border border-primary px-2.5 py-[7px] text-sm" />
              </div>
              <button
                onClick={() => setLock(!lock)}
                title={lock ? "Locked" : "Unlocked"}
                className={`mt-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-sm ${lock ? "bg-primary text-on-primary" : "bg-surface text-primary"}`}
              >
                {lock ? <ToolLockIcon {...iconProps} size={14} /> : <ToolUnlockIcon {...iconProps} size={14} />}
              </button>
              <div>
                <label className="mb-1 block text-xs text-on-surface-variant">Height (px)</label>
                <input type="number" value={height} min={10} onChange={(e) => setH(e.target.value)} className="w-24 rounded-md border border-primary px-2.5 py-[7px] text-sm" />
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-1 flex justify-between">
                <label className="text-xs text-on-surface-variant">Scale</label>
                <strong className="text-xs text-on-surface">
                  {pct}%  →  {effW}x{effH}px
                </strong>
              </div>
              <input type="range" min={1} max={300} value={pct} onChange={(e) => setPct(+e.target.value)} className="w-full accent-primary" />
            </div>
          )}
          <p className="mb-0 mt-2 text-xs text-on-surface-variant">
            Original: {image.w}x{image.h}px · Max 3x: {image.w * 3}x{image.h * 3}px
          </p>
          <div className="mt-2.5">
            <img src={image.url} alt="Resize source" className="max-h-[180px] max-w-full rounded-lg border border-outline-variant/40" />
          </div>
        </Card>

        <Card className="mb-3.5">
          <SectionHeader>🎨 Format & Compression</SectionHeader>
          <div className="mb-3 flex gap-1.5">
            {["JPG", "PNG", "WebP"].map((f) => (
              <Btn
                key={f}
                onClick={() => setFmt(f)}
                variant={format === f ? "primary" : "ghost"}
                small
                disabled={!supportedResizeFormats.includes(f)}
                title={supportedResizeFormats.includes(f) ? undefined : "Not supported in this browser"}
              >
                {f}
              </Btn>
            ))}
          </div>
          <AlertBox msg={warn} variant="warn" />

          <div className="mt-3.5">
            <label className="mb-2 block text-xs text-on-surface-variant">Resize Mode</label>
            <div className="flex gap-1.5">
              {["stretch", "fit", "fill"].map((m) => (
                <Btn key={m} onClick={() => setResizeMode(m)} variant={resizeMode === m ? "primary" : "ghost"} small>
                  {m === "stretch" ? "Stretch" : m === "fit" ? "Fit" : "Fill"}
                </Btn>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-on-surface-variant">
              {resizeMode === "stretch" && "Stretch to exact dimensions (may distort)"}
              {resizeMode === "fit" && "Scale proportionally to fit inside (may letterbox)"}
              {resizeMode === "fill" && "Scale and center-crop to fill exactly"}
            </p>
          </div>

          {format === "JPG" && (
            <div className="mt-2.5">
              <label className="mb-1 block text-xs text-on-surface-variant">JPG Background Fill</label>
              <input type="color" value={jpgBackground} onChange={(e) => setJpgBackground(e.target.value)} className="h-[34px] w-[60px] rounded-md border border-outline-variant/40" />
            </div>
          )}

          {format !== "PNG" ? (
            <div className="mt-3">
              <div className="mb-2.5 flex gap-1.5">
                {["quality", "target"].map((m) => (
                  <Btn key={m} onClick={() => setSizeMode(m)} variant={sizeMode === m ? "primary" : "ghost"} small>
                    {m === "quality" ? "Quality %" : "Target Size"}
                  </Btn>
                ))}
              </div>
              {sizeMode === "quality" ? (
                <div>
                  <div className="mb-1 flex justify-between">
                    <label className="text-xs text-on-surface-variant">Quality</label>
                    <span className="text-xs font-bold text-on-surface">{quality}%</span>
                  </div>
                  <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-primary" />
                  <div className="mt-[5px] flex justify-between text-xs">
                    <span className="text-on-surface-variant">Smaller file</span>
                    <span className="text-on-surface-variant">Approx. size ~{estKB} KB</span>
                    <span className="text-on-surface-variant">Better quality</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {SIZE_PRESETS.map((p) => (
                      <Btn key={p.label} onClick={() => setTargetKB(p.target)} variant={targetKB === p.target ? "primary" : "ghost"} small>
                        {p.label} (&lt;{p.target}KB)
                      </Btn>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-on-surface-variant">Custom:</label>
                    <input type="number" value={targetKB} onChange={(e) => setTargetKB(+e.target.value)} min={10} className="w-[70px] rounded-md border border-primary px-2 py-1.5 text-[13px]" />
                    <span className="text-xs text-on-surface-variant">KB (±5% accuracy)</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="mb-0 mt-2 text-xs text-on-surface-variant">PNG is always lossless.</p>
          )}
        </Card>

        <AlertBox msg={error} />
        <Card>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
            <input
              type="checkbox"
              checked={stripExif}
              onChange={(e) => setStripExif(e.target.checked)}
            />
            Strip EXIF metadata (recommended for privacy)
          </label>
        </Card>
        <div className="mt-2.5 flex gap-2">
          <Btn onClick={onBack} variant="secondary">
            Back
          </Btn>
          <Btn
            onClick={() => {
              if (validate()) onNext({ width: effW, height: effH, format, quality, sizeMode, targetKB, jpgBackground, preserveExif: !stripExif, resizeMode });
            }}
            className="flex-1"
          >
            Next: Crop →
          </Btn>
        </div>
      </div>

      <div className="max-h-[560px] overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface p-3">
        <p className="mb-2 mt-0 text-[10px] font-bold uppercase tracking-[0.06em] text-on-surface">Platform Presets</p>
        {Object.entries(PRESETS).map(([pl, list]) => (
          <div key={pl} className="mb-0.5">
            <button
              onClick={() => setActivePlatform(activePlatform === pl ? null : pl)}
              className={`flex w-full justify-between rounded-md border-none px-2 py-1.5 text-left text-xs font-semibold text-on-surface ${activePlatform === pl ? "bg-surface-container" : "bg-transparent"}`}
            >
              <span>
                {ICONS[pl]} {pl}
              </span>
              <span className="text-[9px] text-primary">{activePlatform === pl ? "▲" : "▼"}</span>
            </button>
            {activePlatform === pl &&
              list.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className={`mb-px w-full rounded-[5px] border-none py-1 pl-[18px] pr-2 text-left text-xs ${activePreset === p.name ? "bg-primary text-on-primary" : "bg-transparent text-on-surface"}`}
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[10px] opacity-65">
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

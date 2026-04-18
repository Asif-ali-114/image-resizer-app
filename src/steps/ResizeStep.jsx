import { useEffect, useMemo, useState } from "react";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import { PRESETS, ICONS, SIZE_PRESETS } from "../constants/presets.js";
import { LOCAL_STORAGE_SETTINGS_KEY } from "../constants/formats.js";

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

function sanitizeSettings(raw) {
  const next = raw && typeof raw === "object" ? raw : {};
  const quality = Number.isFinite(Number(next.quality)) ? Math.round(Number(next.quality)) : 85;
  const rawFormat = typeof next.format === "string" ? next.format.toLowerCase() : "jpeg";
  const normalizedFormat = ["jpeg", "png", "webp"].includes(rawFormat) ? rawFormat : "jpeg";
  const jpgBackground = typeof next.jpgBackground === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(next.jpgBackground)
    ? next.jpgBackground
    : "#ffffff";

  return {
    quality: Math.min(100, Math.max(1, quality)),
    format: normalizedFormat === "jpeg" ? "JPG" : normalizedFormat === "png" ? "PNG" : "WebP",
    jpgBackground,
  };
}

export default function ResizeStep({ image, onNext, onBack }) {
  const saved = useMemo(() => {
    try {
      return sanitizeSettings(JSON.parse(localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY) || "{}"));
    } catch {
      return sanitizeSettings({});
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
                <label style={{ fontSize: 11, color: "var(--c-muted)", display: "block", marginBottom: 4 }}>Width (px)</label>
                <input type="number" value={width} min={10} onChange={(e) => setW(e.target.value)} style={{ width: 96, padding: "7px 10px", border: "1px solid var(--c-blue)", borderRadius: 6, fontSize: 14 }} />
              </div>
              <button
                onClick={() => setLock(!lock)}
                title={lock ? "Locked" : "Unlocked"}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "2px solid var(--c-blue)",
                  background: lock ? "var(--c-navy)" : "var(--c-white)",
                  color: lock ? "var(--c-white)" : "var(--c-blue)",
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
                <label style={{ fontSize: 11, color: "var(--c-muted)", display: "block", marginBottom: 4 }}>Height (px)</label>
                <input type="number" value={height} min={10} onChange={(e) => setH(e.target.value)} style={{ width: 96, padding: "7px 10px", border: "1px solid var(--c-blue)", borderRadius: 6, fontSize: 14 }} />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ fontSize: 11, color: "var(--c-muted)" }}>Scale</label>
                <strong style={{ fontSize: 12, color: "var(--c-navy)" }}>
                  {pct}%  →  {effW}x{effH}px
                </strong>
              </div>
              <input type="range" min={1} max={300} value={pct} onChange={(e) => setPct(+e.target.value)} style={{ width: "100%", accentColor: "var(--c-navy)" }} />
            </div>
          )}
          <p style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 8, marginBottom: 0 }}>
            Original: {image.w}x{image.h}px · Max 3x: {image.w * 3}x{image.h * 3}px
          </p>
          <div style={{ marginTop: 10 }}>
            <img src={image.url} alt="Resize source" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8, border: "1px solid var(--c-lb)" }} />
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
              <label style={{ fontSize: 11, color: "var(--c-muted)", display: "block", marginBottom: 4 }}>JPG Background Fill</label>
              <input type="color" value={jpgBackground} onChange={(e) => setJpgBackground(e.target.value)} style={{ width: 60, height: 34, border: "1px solid var(--c-lb)", borderRadius: 6, background: "var(--c-white)" }} />
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
                    <label style={{ fontSize: 11, color: "var(--c-muted)" }}>Quality</label>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-navy)" }}>{quality}%</span>
                  </div>
                  <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} style={{ width: "100%", accentColor: "var(--c-navy)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11 }}>
                    <span style={{ color: "var(--c-muted)" }}>Smaller file</span>
                    <span style={{ color: "var(--c-muted)" }}>Approx. size ~{estKB} KB</span>
                    <span style={{ color: "var(--c-muted)" }}>Better quality</span>
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
                    <label style={{ fontSize: 11, color: "var(--c-muted)" }}>Custom:</label>
                    <input type="number" value={targetKB} onChange={(e) => setTargetKB(+e.target.value)} min={10} style={{ width: 70, padding: "6px 8px", border: "1px solid var(--c-blue)", borderRadius: 6, fontSize: 13 }} />
                    <span style={{ fontSize: 11, color: "var(--c-muted)" }}>KB (±5% accuracy)</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 8, marginBottom: 0 }}>PNG is always lossless.</p>
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

      <div style={{ background: "var(--c-bg)", border: "1px solid var(--c-lb)", borderRadius: 12, padding: 12, overflowY: "auto", maxHeight: 560 }}>
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "var(--c-navy)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Platform Presets</p>
        {Object.entries(PRESETS).map(([pl, list]) => (
          <div key={pl} style={{ marginBottom: 2 }}>
            <button
              onClick={() => setActivePlatform(activePlatform === pl ? null : pl)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "6px 8px",
                background: activePlatform === pl ? "var(--c-lb)" : "transparent",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--c-navy)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                {ICONS[pl]} {pl}
              </span>
              <span style={{ color: "var(--c-blue)", fontSize: 9 }}>{activePlatform === pl ? "▲" : "▼"}</span>
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
                    background: activePreset === p.name ? "var(--c-navy)" : "transparent",
                    border: "none",
                    borderRadius: 5,
                    cursor: "pointer",
                    fontSize: 11,
                    color: activePreset === p.name ? "var(--c-white)" : "var(--c-text)",
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

import { useCallback, useEffect, useRef, useState } from "react";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import ComparisonSlider from "../components/ComparisonSlider.jsx";
import { FORMAT_MIME } from "../constants/formats.js";
import { processSingleImage, downloadBlob } from "../imagePipeline.js";
import { bytesToText } from "../utils/imageUtils.js";
import { blobRegistry } from "../utils/BlobRegistry.js";

function Sec({ children, icon }) {
  return <h3 className="text-lg font-headline font-bold text-on-surface mb-4 flex items-center gap-2">{icon && <span className="text-xl">{icon}</span>}{children}</h3>;
}

export default function OutputStep({ image, settings, crop, onBack, onReset, onNotice }) {
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
  const [procError, setProcError] = useState(null);
  const outputTagRef = useRef(`single-output-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const drawBefore = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !imgRef.current.complete) return;
    const ctx = c.getContext("2d");
    c.width = Math.min(580, image.w);
    c.height = Math.round((c.width * image.h) / image.w);
    ctx.drawImage(imgRef.current, 0, 0, c.width, c.height);
  }, [image.w, image.h]);

  const drawAfter = useCallback(() => {
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
  }, [url, settings.width, settings.height]);

  useEffect(() => {
    imgRef.current.onload = () => {
      setImgLoaded(true);
      drawBefore();
    };
    imgRef.current.src = image.url;
  }, [image.url, drawBefore]);

  useEffect(() => {
    const outputTag = outputTagRef.current;
    return () => {
      blobRegistry.release(outputTag);
    };
  }, []);

  useEffect(() => {
    if (view === "before") drawBefore();
    else if (view === "after" && done) drawAfter();
  }, [view, done, imgLoaded, url, drawBefore, drawAfter]);

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
      setProcError(null);
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
      blobRegistry.replaceUrl(outputTagRef.current, nextUrl);
      setProgress(100);
      setStage("Done");
      setOutBytes(result.bytes);
      setOutputBlob(result.blob);
      setUrl(nextUrl);
      if (result.warning === "target_size_unreachable") {
        onNotice?.({ type: "info", message: "Could not reach exact target size — returned closest result." });
      }
      setProcTime(Math.round(performance.now() - t0));
      setDone(true);
      setView("after");
    } catch (err) {
      setProcError(err?.message || "Processing failed.");
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
        <div style={{ background: "var(--c-gray)", borderRadius: 8, display: "flex", justifyContent: "center", minHeight: 160, padding: 8 }}>
          <canvas ref={canvasRef} style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 4, display: "block" }} />
        </div>
        {processing && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--c-muted)", marginBottom: 4 }}>
              <span>{stage}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 7, background: "var(--c-lb)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--c-blue)", width: `${progress}%`, borderRadius: 4, transition: "width 0.12s" }} />
            </div>
          </div>
        )}
      </Card>

      {done && url && (
        <Card>
          <Sec>↔ Compare</Sec>
          <ComparisonSlider
            before={image.url}
            after={url}
            beforeLabel="Original"
            afterLabel="Output"
            beforeInfo={bytesToText(image.size)}
            afterInfo={outBytes ? bytesToText(outBytes) : "-"}
            width="100%"
            height={280}
          />
        </Card>
      )}

      <div>
        <Card style={{ marginBottom: 12 }}>
          <Sec>⚙ Summary</Sec>
          {[ ["Dimensions", `${settings.width}x${settings.height}px`], ["Format", settings.format], ["Crop", crop ? `${crop.w}x${crop.h} @ (${crop.x},${crop.y})` : "None"] ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--c-accent)", fontSize: 12 }}>
              <span style={{ color: "var(--c-muted)" }}>{k}</span>
              <strong style={{ color: "var(--c-navy)", maxWidth: 140, textAlign: "right", wordBreak: "break-all" }}>{v}</strong>
            </div>
          ))}
        </Card>

        {done && outBytes && (
          <Card style={{ marginBottom: 12, background: "var(--c-success-card-bg)", border: "1px solid var(--c-success-card-border)" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: "0 0 3px", fontSize: 11, color: "var(--c-muted)" }}>Output file size</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--c-success)" }}>{bytesToText(outBytes)}</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--c-muted)" }}>{procTime ? `${procTime}ms` : ""}</p>
            </div>
          </Card>
        )}

        {!done && (
          <>
            <Btn onClick={process} disabled={processing} style={{ width: "100%", marginBottom: 8 }}>
              {processing ? "Processing..." : "⚡ Process Image"}
            </Btn>
            {procError && <p style={{ color: "red", margin: "0 0 8px" }}>{procError}</p>}
          </>
        )}

        {done && (
          <>
            <Btn
              onClick={() => {
                const safeName = image.name
                  .replace(/\.[^.]+$/, "")
                  .replace(/[^a-zA-Z0-9_-]/g, "_")
                  .slice(0, 100);
                const name = `${safeName}_${settings.width}x${settings.height}.${settings.format.toLowerCase()}`;
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

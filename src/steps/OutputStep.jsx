import { useCallback, useEffect, useRef, useState } from "react";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import ComparisonSlider from "../components/ComparisonSlider.jsx";
import { FORMAT_MIME } from "../constants/formats.js";
import { processSingleImage, downloadBlob } from "../imagePipeline.js";
import { bytesToText } from "../utils/imageUtils.js";
import { blobRegistry } from "../utils/BlobRegistry.js";
import { iconProps, ToolArrowSwapIcon, ToolFileDownIcon, ToolMaximizeIcon, ToolSparklesIcon } from "../components/AppIcons.jsx";
import SectionHeader from "../components/SectionHeader.jsx";


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
        onNotice,
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[18px]">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeader><span className="inline-flex items-center gap-2"><ToolMaximizeIcon {...iconProps} size={16} />Preview</span></SectionHeader>
          {done && (
            <div className="flex gap-1.5">
              {["before", "after"].map((v) => (
                <Btn key={v} onClick={() => setView(v)} variant={view === v ? "primary" : "ghost"} small>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Btn>
              ))}
            </div>
          )}
        </div>
        <div className="flex min-h-40 justify-center rounded-lg bg-surface-container p-2">
          <canvas ref={canvasRef} className="block max-h-[300px] max-w-full rounded" />
        </div>
        {processing && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-on-surface-variant">
              <span>{stage}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-[7px] overflow-hidden rounded bg-outline-variant/40">
              <div className="h-full rounded bg-primary transition-[width] duration-100" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </Card>

      {done && url && (
        <Card>
          <SectionHeader><span className="inline-flex items-center gap-2"><ToolArrowSwapIcon {...iconProps} size={16} />Compare</span></SectionHeader>
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
        <Card className="mb-3">
          <SectionHeader><span className="inline-flex items-center gap-2"><ToolSparklesIcon {...iconProps} size={16} />Summary</span></SectionHeader>
          {[ ["Dimensions", `${settings.width}x${settings.height}px`], ["Format", settings.format], ["Crop", crop ? `${crop.w}x${crop.h} @ (${crop.x},${crop.y})` : "None"] ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-outline-variant/40 py-[5px] text-xs">
              <span className="text-on-surface-variant">{k}</span>
              <strong className="max-w-[140px] break-all text-right text-on-surface">{v}</strong>
            </div>
          ))}
        </Card>

        {done && outBytes && (
          <Card className="mb-3 border border-green-400/30 bg-green-400/10">
            <div className="text-center">
              <p className="mb-[3px] mt-0 text-xs text-on-surface-variant">Output file size</p>
              <p className="m-0 text-[22px] font-extrabold text-green-400">{bytesToText(outBytes)}</p>
              <p className="mb-0 mt-[3px] text-xs text-on-surface-variant">{procTime ? `${procTime}ms` : ""}</p>
            </div>
          </Card>
        )}

        {!done && (
          <>
            <Btn onClick={process} disabled={processing} className="mb-2 w-full">
              {processing ? "Processing..." : "Process Image"}
            </Btn>
            {procError && <p className="mb-2 mt-0 text-error">{procError}</p>}
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
              className="mb-2 w-full"
            >
              <span className="inline-flex items-center gap-2"><ToolFileDownIcon {...iconProps} />Download {settings.format}</span>
            </Btn>
            <Btn onClick={copyToClipboard} variant="secondary" className="mb-2 w-full">
              Copy To Clipboard
            </Btn>
          </>
        )}

        <div className="flex gap-1.5">
          <Btn onClick={onBack} variant="secondary" className="flex-1">
            Edit
          </Btn>
          <Btn onClick={onReset} variant="secondary" className="flex-1">
            New
          </Btn>
        </div>
      </div>
    </div>
  );
}

import ImageProcessorWorker from "./imageProcessor.worker.js?worker";
import { bisectQuality } from "./utils/bisect.js";

const SMALL_IMAGE_PIXEL_LIMIT = 1_600_000;
const WORKER_IMAGE_PIXEL_LIMIT = 2_500_000;
const DEFAULT_POOL_SIZE = Math.max(2, Math.min(4, Math.floor((navigator.hardwareConcurrency || 4) / 2)));

const FORMAT_MIME = {
  JPG: "image/jpeg",
  PNG: "image/png",
  WebP: "image/webp",
};

let workerPool = null;
let _resize;
let _encodeJpeg;
let _encodePng;
let _encodeWebp;

async function getResize() {
  if (!_resize) {
    const mod = await import("@jsquash/resize");
    _resize = mod.default;
  }
  return _resize;
}

async function getJpegEncoder() {
  if (!_encodeJpeg) {
    const mod = await import("@jsquash/jpeg");
    _encodeJpeg = mod.encode;
  }
  return _encodeJpeg;
}

async function getPngEncoder() {
  if (!_encodePng) {
    const mod = await import("@jsquash/png");
    _encodePng = mod.encode;
  }
  return _encodePng;
}

async function getWebpEncoder() {
  if (!_encodeWebp) {
    const mod = await import("@jsquash/webp");
    _encodeWebp = mod.encode;
  }
  return _encodeWebp;
}

function supportsWorkers() {
  return typeof Worker !== "undefined";
}

function supportsWorkerCanvasPipeline() {
  return supportsWorkers() && typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap === "function";
}

function supportsCanvasPath() {
  return typeof document !== "undefined" && typeof document.createElement === "function";
}

function mimeFromFormat(format) {
  return FORMAT_MIME[format] || "image/jpeg";
}

function getOutputDimensions(settings, sourceWidth, sourceHeight) {
  if (settings.scaleMode === "percent") {
    return {
      width: Math.max(1, Math.round((sourceWidth * settings.pct) / 100)),
      height: Math.max(1, Math.round((sourceHeight * settings.pct) / 100)),
    };
  }

  return {
    width: Math.max(1, Math.round(settings.width)),
    height: Math.max(1, Math.round(settings.height)),
  };
}

function shouldUseWorker({ sourceWidth, sourceHeight, outputWidth, outputHeight, forceWorker = false }) {
  if (forceWorker) return supportsWorkerCanvasPipeline();
  if (!supportsWorkerCanvasPipeline()) return false;

  const sourcePixels = sourceWidth * sourceHeight;
  const outputPixels = outputWidth * outputHeight;
  return sourcePixels >= WORKER_IMAGE_PIXEL_LIMIT || outputPixels >= WORKER_IMAGE_PIXEL_LIMIT;
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawHighQualityCanvas(sourceCanvas, targetW, targetH, canvasFactory = createCanvas) {
  let current = sourceCanvas;
  while (current.width * 0.5 > targetW && current.height * 0.5 > targetH) {
    const half = canvasFactory(Math.max(targetW, Math.floor(current.width * 0.5)), Math.max(targetH, Math.floor(current.height * 0.5)));
    const hctx = half.getContext("2d");
    hctx.imageSmoothingEnabled = true;
    hctx.imageSmoothingQuality = "high";
    hctx.drawImage(current, 0, 0, half.width, half.height);
    current = half;
  }

  if (current.width !== targetW || current.height !== targetH) {
    const out = canvasFactory(targetW, targetH);
    const octx = out.getContext("2d");
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(current, 0, 0, targetW, targetH);
    return out;
  }

  return current;
}

async function canvasToBlob(canvas, type, quality) {
  if (typeof canvas.convertToBlob === "function") {
    return await canvas.convertToBlob({ type, quality });
  }

  return await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function blobToObjectUrl(blob) {
  return URL.createObjectURL(blob);
}

function parseFileMime(file) {
  if (file?.type) return file.type;
  const ext = file?.name?.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "bmp") return "image/bmp";
  if (ext === "tif" || ext === "tiff") return "image/tiff";
  return "image/png";
}


function applyJpegBackground(canvas, backgroundColor) {
  const out = createCanvas(canvas.width, canvas.height);
  const ctx = out.getContext("2d");
  ctx.fillStyle = backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  return out;
}

async function encodeCanvas(canvas, format, quality) {
  const mime = mimeFromFormat(format);
  return await canvasToBlob(canvas, mime, format === "PNG" ? undefined : quality / 100);
}

async function encodeImageData(imageData, format, quality) {
  switch (format) {
    case "PNG":
      return await (await getPngEncoder())(imageData);
    case "WebP":
      return await (await getWebpEncoder())(imageData, { quality });
    case "JPG":
    default:
      return await (await getJpegEncoder())(imageData, { quality, progressive: true, optimize_coding: true, auto_subsample: true });
  }
}

async function processOnMainThread({ file, settings, crop, sourceWidth, sourceHeight, sourceUrl, onProgress }) {
  if (!supportsCanvasPath()) {
    throw new Error("Canvas processing is unavailable in this browser.");
  }

  const transientUrl = sourceUrl || URL.createObjectURL(file);
  const shouldRevoke = !sourceUrl;

  try {
    onProgress?.({ stage: "Preparing source", progress: 25 });
    const img = await new Promise((resolve, reject) => {
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => reject(new Error("Image decode failed"));
      fallback.src = transientUrl;
    });

    const inputWidth = sourceWidth || img.width;
    const inputHeight = sourceHeight || img.height;
    const targetSize = settings.scaleMode === "percent"
      ? {
          width: Math.max(1, Math.round((inputWidth * settings.pct) / 100)),
          height: Math.max(1, Math.round((inputHeight * settings.pct) / 100)),
        }
      : {
          width: Math.max(1, Math.round(settings.width)),
          height: Math.max(1, Math.round(settings.height)),
        };

    const sourceCanvas = createCanvas(crop ? crop.w : inputWidth, crop ? crop.h : inputHeight);
    const sctx = sourceCanvas.getContext("2d");

    if (crop) {
      sctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, sourceCanvas.width, sourceCanvas.height);
    } else {
      sctx.drawImage(img, 0, 0, sourceCanvas.width, sourceCanvas.height);
    }

    onProgress?.({ stage: "Resizing", progress: 55 });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    let finalCanvas = drawHighQualityCanvas(sourceCanvas, targetSize.width, targetSize.height, createCanvas);

    if (settings.format === "JPG") {
      finalCanvas = applyJpegBackground(finalCanvas, settings.jpgBackground);
    }

    onProgress?.({ stage: "Encoding", progress: 80 });
    await new Promise((resolve) => requestAnimationFrame(resolve));

    let blob;
    if (settings.sizeMode === "target" && settings.format !== "PNG") {
      const best = await bisectQuality(async (q) => {
        const candidate = await encodeCanvas(finalCanvas, settings.format, q);
        onProgress?.({ stage: "Refining size", progress: Math.min(98, 80 + Math.round((q / 100) * 16)) });
        await new Promise((resolve) => requestAnimationFrame(resolve));
        return candidate;
      }, settings.targetKB, 8);
      blob = best || (await encodeCanvas(finalCanvas, settings.format, settings.quality));
    } else {
      blob = await encodeCanvas(finalCanvas, settings.format, settings.quality);
    }

    onProgress?.({ stage: "Done", progress: 100 });
    return {
      blob,
      bytes: blob.size,
      mime: blob.type || mimeFromFormat(settings.format),
      method: "canvas",
        width: targetSize.width,
        height: targetSize.height,
    };
  } finally {
    if (shouldRevoke) URL.revokeObjectURL(transientUrl);
  }
}

class ImageWorkerPool {
  constructor(size = DEFAULT_POOL_SIZE) {
    this.size = size;
    this.idle = [];
    this.queue = [];
    this.workers = [];
    this.started = false;
  }

  ensureWorkers() {
    if (!supportsWorkerCanvasPipeline()) return;
    while (this.workers.length < this.size) {
      const worker = new ImageProcessorWorker();
      this.workers.push(worker);
      this.idle.push(worker);
    }
  }

  acquire() {
    this.ensureWorkers();
    return this.idle.pop() || null;
  }

  release(worker) {
    if (!worker) return;
    this.idle.push(worker);
    this.pump();
  }

  remove(worker) {
    this.idle = this.idle.filter((entry) => entry !== worker);
    this.workers = this.workers.filter((entry) => entry !== worker);
    try {
      worker.terminate();
    } catch {
      // no-op
    }
  }

  schedule(payload, onProgress) {
    if (!supportsWorkerCanvasPipeline()) {
      return Promise.reject(new Error("Worker pipeline unavailable."));
    }

    this.ensureWorkers();

    return new Promise((resolve, reject) => {
      this.queue.push({ payload, onProgress, resolve, reject });
      this.pump();
    });
  }

  pump() {
    if (!this.queue.length) return;
    const worker = this.acquire();
    if (!worker) return;

    const job = this.queue.shift();
    const taskId = `irp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const cleanup = () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
    };

    const handleError = (event) => {
      cleanup();
      this.remove(worker);
      job.reject(event.error || new Error("Worker processing failed."));
      this.pump();
    };

    const handleMessage = (event) => {
      const data = event.data;
      if (!data || data.taskId !== taskId) return;

      if (data.type === "progress") {
        job.onProgress?.(data.progress);
        return;
      }

      if (data.type === "result") {
        cleanup();
        this.release(worker);
        const result = data.result;
        const blob = new Blob([result.buffer], { type: result.mime });
        job.resolve({
          blob,
          bytes: result.bytes ?? blob.size,
          mime: result.mime,
          method: result.method || "worker",
          width: result.width,
          height: result.height,
        });
        return;
      }

      if (data.type === "error") {
        cleanup();
        this.remove(worker);
        job.reject(new Error(data.message || "Worker processing failed."));
        this.pump();
      }
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    worker.postMessage({ taskId, ...job.payload });
  }
}

function getWorkerPool() {
  if (!workerPool) workerPool = new ImageWorkerPool();
  return workerPool;
}

function shouldPreferWorkerForSingle({ sourceWidth, sourceHeight, outputWidth, outputHeight }) {
  const sourcePixels = sourceWidth * sourceHeight;
  const outputPixels = outputWidth * outputHeight;
  return shouldUseWorker({ sourceWidth, sourceHeight, outputWidth, outputHeight }) || sourcePixels >= SMALL_IMAGE_PIXEL_LIMIT || outputPixels >= SMALL_IMAGE_PIXEL_LIMIT;
}

export async function processSingleImage({ file, settings, crop = null, sourceWidth, sourceHeight, sourceUrl = null, onProgress }) {
  const fallbackWidth = crop ? crop.w : sourceWidth || settings.width;
  const fallbackHeight = crop ? crop.h : sourceHeight || settings.height;
  const resolvedSize = getOutputDimensions(settings, fallbackWidth, fallbackHeight);
  const workerFriendly = shouldPreferWorkerForSingle({
    sourceWidth: fallbackWidth,
    sourceHeight: fallbackHeight,
    outputWidth: resolvedSize.width,
    outputHeight: resolvedSize.height,
  });

  if (workerFriendly && supportsWorkerCanvasPipeline()) {
    try {
      const result = await getWorkerPool().schedule(
        {
          file,
          settings: {
            ...settings,
            width: settings.width,
            height: settings.height,
            sourceWidth: fallbackWidth,
            sourceHeight: fallbackHeight,
            crop,
          },
        },
        onProgress,
      );
      return result;
    } catch {
      // Fall through to canvas fallback.
    }
  }

  return await processOnMainThread({ file, settings: { ...settings, width: resolvedSize.width, height: resolvedSize.height }, crop, sourceWidth, sourceHeight, sourceUrl, onProgress });
}

export async function processBulkImages({ files, settings, onItemProgress, onItemResult, onItemFail }) {
  if (!files.length) return;

  const useWorkers = supportsWorkerCanvasPipeline();

  if (useWorkers) {
    const pool = getWorkerPool();
    await Promise.all(
      files.map((file, index) =>
        pool
          .schedule(
            {
              file,
              settings: {
                ...settings,
                sourceWidth: undefined,
                sourceHeight: undefined,
                crop: null,
              },
            },
            (progress) => onItemProgress?.(index, progress),
          )
          .then((result) => {
            onItemResult?.({ index, file, ...result });
          })
          .catch((error) => {
            onItemFail?.({ index, name: file.name, reason: error?.message || "Decode or encode failed" });
          }),
      ),
    );
    return;
  }

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    try {
      onItemProgress?.(index, { stage: "Preparing source", progress: 10 });
      const result = await processSingleImage({
        file,
        settings,
        sourceWidth: 0,
        sourceHeight: 0,
        sourceUrl: null,
        onProgress: (progress) => onItemProgress?.(index, progress),
      });
      onItemResult?.({ index, file, ...result });
    } catch (error) {
      onItemFail?.({ index, name: file.name, reason: error?.message || "Decode or encode failed" });
    }
  }
}

export function getMimeFromFormat(format) {
  return mimeFromFormat(format);
}

export function downloadBlob(filename, blob) {
  const url = blobToObjectUrl(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

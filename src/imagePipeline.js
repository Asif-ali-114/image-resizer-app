import ImageProcessorWorker from "./imageProcessor.worker.js?worker";
import { isCodecSupported } from "./utils/codecCapabilities.js";

const SMALL_IMAGE_PIXEL_LIMIT = 1_600_000;
const WORKER_IMAGE_PIXEL_LIMIT = 2_500_000;
const DEFAULT_POOL_SIZE = Math.max(2, Math.min(4, Math.floor((navigator.hardwareConcurrency || 4) / 2)));

const FORMAT_MIME = {
  JPG: "image/jpeg",
  PNG: "image/png",
  WebP: "image/webp",
};

let workerPool = null;

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

function drawResizeCanvas(sourceCanvas, targetW, targetH, resizeMode = "stretch", canvasFactory = createCanvas) {
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;

  if (resizeMode === "fit" || resizeMode === "fill") {
    const scaleF = Math.min(targetW / srcW, targetH / srcH); // fit
    const scaleL = Math.max(targetW / srcW, targetH / srcH); // fill
    const scale = resizeMode === "fit" ? scaleF : scaleL;

    const dw = srcW * scale;
    const dh = srcH * scale;
    const dx = (targetW - dw) / 2;
    const dy = (targetH - dh) / 2;

    // Create intermediate canvas for scaling
    const scaled = canvasFactory(Math.ceil(dw), Math.ceil(dh));
    const sctx = scaled.getContext("2d");
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(sourceCanvas, 0, 0, dw, dh);

    // Create final canvas
    const out = canvasFactory(targetW, targetH);
    const octx = out.getContext("2d");

    // Fill background for fit mode (for JPEGs that need white)
    if (resizeMode === "fit") {
      octx.fillStyle = "#ffffff";
      octx.fillRect(0, 0, targetW, targetH);
    }

    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(scaled, dx, dy);
    return out;
  }

  // stretch mode (default)
  return drawHighQualityCanvas(sourceCanvas, targetW, targetH, canvasFactory);
}

async function canvasToBlob(canvas, type, quality) {
  if (typeof canvas.convertToBlob === "function") {
    return await canvas.convertToBlob({ type, quality });
  }

  return await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function blobToDataUrl(blob) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read binary data."));
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl) {
  const response = await globalThis.fetch(dataUrl);
  return await response.blob();
}

function isJpegLikeMime(mime) {
  const value = String(mime || "").toLowerCase();
  return value === "image/jpeg" || value === "image/jpg";
}

async function getExifFromSource(file, settings, onNotice) {
  if (!(settings?.preserveExif && settings?.format === "JPG")) return { exifBytes: null };
  if (!isJpegLikeMime(file?.type)) return { exifBytes: null };

  try {
    const piexifModule = await import("piexifjs");
    const piexif = piexifModule?.default || piexifModule;
    const sourceDataUrl = await blobToDataUrl(file);
    const exifObj = piexif.load(sourceDataUrl);
    const hasGps = !!(exifObj?.GPS && Object.keys(exifObj.GPS).length);
    if (hasGps) {
      onNotice?.({
        type: "warning",
        message: "This image contains GPS location data. Enable Strip EXIF to remove it before sharing.",
      });
    }

    return { exifBytes: piexif.dump(exifObj), piexif };
  } catch {
    return { exifBytes: null };
  }
}

async function injectExifIfNeeded(blob, exifMeta, settings) {
  if (!(settings?.preserveExif && settings?.format === "JPG")) return blob;
  if (!exifMeta?.exifBytes || !exifMeta?.piexif) return blob;

  try {
    const outputDataUrl = await blobToDataUrl(blob);
    const withExifDataUrl = exifMeta.piexif.insert(exifMeta.exifBytes, outputDataUrl);
    const withExifBlob = await dataUrlToBlob(withExifDataUrl);
    return withExifBlob.type ? withExifBlob : new Blob([withExifBlob], { type: mimeFromFormat(settings.format) });
  } catch {
    return blob;
  }
}

function blobToObjectUrl(blob) {
  return URL.createObjectURL(blob);
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
  if (!isCodecSupported(format)) {
    throw new Error(`Codec for ${format} is not available. Cannot encode silently.`);
  }
  const mime = mimeFromFormat(format);
  return await canvasToBlob(canvas, mime, format === "PNG" ? undefined : quality / 100);
}

async function encodeToTargetSize({
  encodeAtQuality,
  targetKB,
  initialQuality = 80,
  maxIterations = 8,
  epsilon = 0.02,
}) {
  const targetSize = Math.max(1, Number(targetKB) || 1) * 1024;

  let quality = Math.max(1, Math.min(100, initialQuality));
  let bestUnder = null;
  let lowest = null;
  let lowQuality = 1;
  let highQuality = quality;

  while (quality >= 1) {
    const blob = await encodeAtQuality(quality);
    const candidate = { quality, blob, size: blob.size };

    if (!lowest || candidate.quality < lowest.quality) {
      lowest = candidate;
    }

    if (candidate.size <= targetSize) {
      bestUnder = candidate;
      lowQuality = quality;
      break;
    }

    highQuality = quality;
    const next = Math.floor(quality / 2);
    if (next < 1) break;
    quality = next;
  }

  if (!bestUnder) {
    const minBlob = lowest?.blob || (await encodeAtQuality(1));
    return { blob: minBlob, warning: "target_size_unreachable" };
  }

  let low = lowQuality;
  let high = highQuality;
  let final = bestUnder;

  for (let i = 0; i < maxIterations; i += 1) {
    if (high - low <= 1) break;

    const mid = Math.max(1, Math.min(100, Math.round((low + high) / 2)));
    const blob = await encodeAtQuality(mid);
    const size = blob.size;

    const relError = Math.abs(size - targetSize) / targetSize;
    if (relError < epsilon) {
      if (size <= targetSize) {
        final = { quality: mid, blob, size };
      }
      break;
    }

    if (size > targetSize) {
      high = mid;
    } else {
      low = mid;
      final = { quality: mid, blob, size };
    }
  }

  if (final?.size <= targetSize) {
    return { blob: final.blob };
  }

  return { blob: (await encodeAtQuality(1)), warning: "target_size_unreachable" };
}

async function processOnMainThread({ file, settings, crop, sourceWidth, sourceHeight, sourceUrl, onProgress, onNotice }) {
  if (!supportsCanvasPath()) {
    throw new Error("Canvas processing is unavailable in this browser.");
  }

  const transientUrl = sourceUrl || URL.createObjectURL(file);
  const shouldRevoke = !sourceUrl;

  try {
    const exifMeta = await getExifFromSource(file, settings, onNotice);
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
    let finalCanvas = drawResizeCanvas(sourceCanvas, targetSize.width, targetSize.height, settings.resizeMode || "stretch", createCanvas);

    if (settings.format === "JPG") {
      finalCanvas = applyJpegBackground(finalCanvas, settings.jpgBackground);
    }

    onProgress?.({ stage: "Encoding", progress: 80 });
    await new Promise((resolve) => requestAnimationFrame(resolve));

    let blob;
    let warning;
    if (settings.sizeMode === "target" && settings.format !== "PNG") {
      const best = await encodeToTargetSize({
        encodeAtQuality: async (q) => {
          const candidate = await encodeCanvas(finalCanvas, settings.format, q);
          onProgress?.({ stage: "Refining size", progress: Math.min(98, 80 + Math.round((q / 100) * 16)) });
          await new Promise((resolve) => requestAnimationFrame(resolve));
          return candidate;
        },
        targetKB: settings.targetKB,
      });
      blob = best.blob;
      warning = best.warning;
    } else {
      blob = await encodeCanvas(finalCanvas, settings.format, settings.quality);
    }

    blob = await injectExifIfNeeded(blob, exifMeta, settings);

    onProgress?.({ stage: "Done", progress: 100 });
    return {
      blob,
      bytes: blob.size,
      mime: blob.type || mimeFromFormat(settings.format),
      method: "canvas",
        width: targetSize.width,
        height: targetSize.height,
      warning,
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

export async function processSingleImage({ file, settings, crop = null, sourceWidth, sourceHeight, sourceUrl = null, onProgress, onNotice }) {
  const fallbackWidth = crop ? crop.w : sourceWidth || settings.width;
  const fallbackHeight = crop ? crop.h : sourceHeight || settings.height;
  const resolvedSize = getOutputDimensions(settings, fallbackWidth, fallbackHeight);
  const workerFriendly = shouldPreferWorkerForSingle({
    sourceWidth: fallbackWidth,
    sourceHeight: fallbackHeight,
    outputWidth: resolvedSize.width,
    outputHeight: resolvedSize.height,
  });

  const preserveExifOnJpeg = settings?.preserveExif && settings?.format === "JPG";

  if (workerFriendly && !preserveExifOnJpeg && supportsWorkerCanvasPipeline()) {
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

  return await processOnMainThread({ file, settings: { ...settings, width: resolvedSize.width, height: resolvedSize.height }, crop, sourceWidth, sourceHeight, sourceUrl, onProgress, onNotice });
}

export async function processBulkImages({ files, settings, isCancelledRef, onItemProgress, onItemResult, onItemFail }) {
  if (!files.length) return;

  const useWorkers = supportsWorkerCanvasPipeline();

  if (useWorkers) {
    const pool = getWorkerPool();
    await Promise.all(
      files.map(async (file, index) => {
        if (isCancelledRef?.current) return;
        try {
          const result = await pool.schedule(
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
          );
          onItemResult?.({ index, file, ...result });
        } catch (error) {
          onItemFail?.({ index, name: file.name, reason: error?.message || "Decode or encode failed" });
        }
      }),
    );
    return;
  }

  for (let index = 0; index < files.length; index += 1) {
    if (isCancelledRef?.current) break;
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
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const CONVERT_MIME = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  bmp: "image/bmp",
  ico: "image/x-icon",
  tiff: "image/tiff",
};

const TRANSPARENT_FORMATS = new Set(["png", "webp", "avif", "gif", "ico", "tiff", "svg"]);
const OPAQUE_FORMATS = new Set(["jpeg", "bmp"]);

let _convertJpegEncode;
let _convertPngEncode;
let _convertWebpEncode;
let _convertAvifEncode;

function normalizeConvertFormat(raw) {
  const lowered = String(raw || "").toLowerCase();
  if (lowered === "jpg") return "jpeg";
  if (lowered === "tif") return "tiff";
  return lowered;
}

function sourceFormatFromFile(file) {
  const fromMime = normalizeConvertFormat(file?.type?.split("/")[1]);
  if (fromMime) return fromMime;
  const ext = normalizeConvertFormat(file?.name?.split(".").pop());
  return ext || "png";
}

function convertNeedsBackgroundFill(srcFormat, outFormat) {
  return TRANSPARENT_FORMATS.has(srcFormat) && OPAQUE_FORMATS.has(outFormat);
}

function createAnyCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  return createCanvas(width, height);
}

function context2d(canvas) {
  return canvas.getContext("2d", { willReadFrequently: true });
}

async function getConvertJpegEncode() {
  if (!_convertJpegEncode) {
    const mod = await import("@jsquash/jpeg");
    _convertJpegEncode = mod.encode;
  }
  return _convertJpegEncode;
}

async function getConvertPngEncode() {
  if (!_convertPngEncode) {
    const mod = await import("@jsquash/png");
    _convertPngEncode = mod.encode;
  }
  return _convertPngEncode;
}

async function getConvertWebpEncode() {
  if (!_convertWebpEncode) {
    const mod = await import("@jsquash/webp");
    _convertWebpEncode = mod.encode;
  }
  return _convertWebpEncode;
}

async function getConvertAvifEncode() {
  if (!_convertAvifEncode) {
    try {
      const mod = await import(/* @vite-ignore */ "@jsquash/avif");
      _convertAvifEncode = mod.encode;
    } catch {
      _convertAvifEncode = null;
    }
  }
  return _convertAvifEncode;
}

async function decodeToBitmap(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fallback below for browsers that fail bitmap decoding for a given mime.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image decode failed"));
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function encodeFromCanvas(canvas, outputFormat, quality) {
  const fmt = normalizeConvertFormat(outputFormat);
  if (!isCodecSupported(fmt)) {
    throw new Error(`Codec for ${fmt} is not available. Cannot encode silently.`);
  }
  const mime = CONVERT_MIME[fmt] || "image/png";
  const q = Math.max(1, Math.min(100, Number(quality) || 85));
  const ctx = context2d(canvas);

  if (["jpeg", "webp", "avif", "png"].includes(fmt)) {
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (fmt === "png") {
        const buffer = await (await getConvertPngEncode())(imageData);
        return new Blob([buffer], { type: mime });
      }

      if (fmt === "jpeg") {
        const buffer = await (await getConvertJpegEncode())(imageData, {
          quality: q,
          progressive: true,
          optimize_coding: true,
          auto_subsample: true,
        });
        return new Blob([buffer], { type: mime });
      }

      if (fmt === "webp") {
        const buffer = await (await getConvertWebpEncode())(imageData, { quality: q });
        return new Blob([buffer], { type: mime });
      }

      const avifEncode = await getConvertAvifEncode();
      if (!avifEncode) throw new Error("AVIF codec unavailable");
      const buffer = await avifEncode(imageData, { quality: q });
      return new Blob([buffer], { type: mime });
    } catch {
      // If a jSquash codec is unavailable in runtime, use canvas blob fallback.
    }
  }

  if (fmt === "png" || fmt === "gif" || fmt === "bmp" || fmt === "ico" || fmt === "tiff") {
    const blob = await canvasToBlob(canvas, mime);
    if (blob) return blob;
  }

  const blob = await canvasToBlob(canvas, mime, q / 100);
  if (blob) return blob;
  throw new Error("Unable to encode output format in this browser.");
}

export async function convertImage({
  file,
  outputFormat,
  quality = 85,
  background = "#ffffff",
  width,
  height,
}) {
  try {
    const outFmt = normalizeConvertFormat(outputFormat);
    const sourceFormat = sourceFormatFromFile(file);
    const source = await decodeToBitmap(file);

    const targetWidth = Math.max(1, Math.round(Number(width) || source.width));
    const targetHeight = Math.max(1, Math.round(Number(height) || source.height));

    const canvas = createAnyCanvas(targetWidth, targetHeight);
    const ctx = context2d(canvas);
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    if (convertNeedsBackgroundFill(sourceFormat, outFmt)) {
      ctx.fillStyle = background || "#ffffff";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    source.close?.();

    const blob = await encodeFromCanvas(canvas, outFmt, quality);
    return {
      blob,
      outputFormat: outFmt,
      originalSize: file.size,
      convertedSize: blob.size,
    };
  } catch (err) {
    return { error: err?.message || "Conversion failed." };
  }
}

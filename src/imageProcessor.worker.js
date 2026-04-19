import resize from "@jsquash/resize";
import { encode as encodeJpeg } from "@jsquash/jpeg";
import { encode as encodePng } from "@jsquash/png";
import { encode as encodeWebp } from "@jsquash/webp";
import { decode as decodeJpeg } from "@jsquash/jpeg";
import { decode as decodePng } from "@jsquash/png";
import { decode as decodeWebp } from "@jsquash/webp";

const WORKER_FORMAT_MIME = {
  JPG: "image/jpeg",
  PNG: "image/png",
  WebP: "image/webp",
};

function createCanvas(width, height) {
  const canvas = new OffscreenCanvas(width, height);
  return canvas;
}

function drawHighQualityCanvas(sourceCanvas, targetW, targetH) {
  let current = sourceCanvas;
  while (current.width * 0.5 > targetW && current.height * 0.5 > targetH) {
    const half = createCanvas(Math.max(targetW, Math.floor(current.width * 0.5)), Math.max(targetH, Math.floor(current.height * 0.5)));
    const hctx = half.getContext("2d");
    hctx.imageSmoothingEnabled = true;
    hctx.imageSmoothingQuality = "high";
    hctx.drawImage(current, 0, 0, half.width, half.height);
    current = half;
  }

  if (current.width !== targetW || current.height !== targetH) {
    const out = createCanvas(targetW, targetH);
    const octx = out.getContext("2d");
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(current, 0, 0, targetW, targetH);
    return out;
  }

  return current;
}

async function canvasToBlob(canvas, type, quality) {
  return await canvas.convertToBlob({ type, quality });
}

function mimeFromFormat(format) {
  return WORKER_FORMAT_MIME[format] || "image/jpeg";
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

async function decodeToImageData(file) {
  const mime = parseFileMime(file);

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = createCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();
    return { imageData: ctx.getImageData(0, 0, canvas.width, canvas.height), width: canvas.width, height: canvas.height };
  } catch {
    const buffer = await file.arrayBuffer();
    switch (mime) {
      case "image/jpeg":
        {
          const imageData = await decodeJpeg(buffer);
          return { imageData, width: imageData.width, height: imageData.height };
        }
      case "image/png":
        {
          const imageData = await decodePng(buffer);
          return { imageData, width: imageData.width, height: imageData.height };
        }
      case "image/webp":
        {
          const imageData = await decodeWebp(buffer);
          return { imageData, width: imageData.width, height: imageData.height };
        }
      default:
        throw new Error("Worker decode fallback is unavailable for this format.");
    }
  }
}

async function resizeWithWasm(imageData, width, height) {
  return await resize(imageData, {
    width,
    height,
    method: "lanczos3",
    fitMethod: "stretch",
    linearRGB: true,
    premultiply: true,
  });
}

function buildJpegBackgroundCanvas(canvas, backgroundColor) {
  const out = createCanvas(canvas.width, canvas.height);
  const ctx = out.getContext("2d");
  ctx.fillStyle = backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  return out;
}

async function encodeImageData(imageData, format, quality) {
  switch (format) {
    case "PNG":
      return await encodePng(imageData);
    case "WebP":
      return await encodeWebp(imageData, { quality });
    case "JPG":
    default:
      return await encodeJpeg(imageData, { quality, progressive: true, optimize_coding: true, auto_subsample: true });
  }
}

async function encodeCanvas(canvas, format, quality) {
  if (format === "PNG") {
    return await canvasToBlob(canvas, mimeFromFormat(format));
  }

  return await canvasToBlob(canvas, mimeFromFormat(format), quality / 100);
}

function resolveOutputDimensions(settings, sourceWidth, sourceHeight) {
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

function toImageData(canvas) {
  const ctx = canvas.getContext("2d");
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

async function processTask(taskId, payload) {
  const { file, settings } = payload;
  const source = await decodeToImageData(file);
  const crop = settings.crop || null;
  const fullCanvas = createCanvas(source.width, source.height);
  fullCanvas.getContext("2d").putImageData(source.imageData, 0, 0);
  const croppedCanvas = crop
    ? (() => {
        const canvas = createCanvas(crop.w, crop.h);
        canvas.getContext("2d").drawImage(fullCanvas, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
        return canvas;
      })()
    : fullCanvas;

  const inputWidth = crop ? crop.w : source.width;
  const inputHeight = crop ? crop.h : source.height;
  const output = resolveOutputDimensions(settings, inputWidth, inputHeight);

  postMessage({ taskId, type: "progress", progress: { stage: "Preparing source", progress: 20 } });

  let resizedCanvas = null;
  let resizedImageData = null;
  let usedWasm = false;

  try {
    postMessage({ taskId, type: "progress", progress: { stage: "Resizing", progress: 45 } });
    resizedImageData = await resizeWithWasm(crop ? toImageData(croppedCanvas) : source.imageData, output.width, output.height);
    usedWasm = true;
  } catch {
    postMessage({ taskId, type: "progress", progress: { stage: "Resizing", progress: 45 } });
    resizedCanvas = drawHighQualityCanvas(croppedCanvas, output.width, output.height);
  }

  if (settings.format === "JPG") {
    if (usedWasm) {
      const composite = createCanvas(output.width, output.height);
      const ctx = composite.getContext("2d");
      ctx.fillStyle = settings.jpgBackground || "#ffffff";
      ctx.fillRect(0, 0, composite.width, composite.height);
      ctx.putImageData(resizedImageData, 0, 0);
      resizedCanvas = composite;
      resizedImageData = null;
    } else {
      resizedCanvas = buildJpegBackgroundCanvas(resizedCanvas, settings.jpgBackground);
    }
  }

  postMessage({ taskId, type: "progress", progress: { stage: "Encoding", progress: 80 } });

  let buffer;
  if (resizedImageData) {
    if (settings.sizeMode === "target" && settings.format !== "PNG") {
      // TODO: deduplicate when worker ESM imports are fully supported
      let low = 10;
      let high = 100;
      let best = null;
      for (let i = 0; i < 8; i += 1) {
        const mid = Math.round((low + high) / 2);
        const candidate = await encodeImageData(resizedImageData, settings.format, mid);
        if (candidate.byteLength / 1024 > settings.targetKB) {
          high = Math.max(10, mid - 1);
        } else {
          best = candidate;
          low = Math.min(100, mid + 1);
        }
        postMessage({ taskId, type: "progress", progress: { stage: "Refining size", progress: 80 + (i + 1) * 2 } });
      }
      buffer = best || (await encodeImageData(resizedImageData, settings.format, settings.quality));
    } else {
      buffer = await encodeImageData(resizedImageData, settings.format, settings.quality);
    }
  } else {
    if (settings.sizeMode === "target" && settings.format !== "PNG") {
      // TODO: deduplicate when worker ESM imports are fully supported
      let low = 10;
      let high = 100;
      let best = null;
      for (let i = 0; i < 8; i += 1) {
        const mid = Math.round((low + high) / 2);
        const candidateBlob = await encodeCanvas(resizedCanvas, settings.format, mid);
        const candidate = await candidateBlob.arrayBuffer();
        if (candidate.byteLength / 1024 > settings.targetKB) {
          high = Math.max(10, mid - 1);
        } else {
          best = candidate;
          low = Math.min(100, mid + 1);
        }
        postMessage({ taskId, type: "progress", progress: { stage: "Refining size", progress: 80 + (i + 1) * 2 } });
      }
      if (best) {
        buffer = best;
      } else {
        const fallbackBlob = await encodeCanvas(resizedCanvas, settings.format, settings.quality);
        buffer = await fallbackBlob.arrayBuffer();
      }
    } else {
      const encodedBlob = await encodeCanvas(resizedCanvas, settings.format, settings.quality);
      buffer = await encodedBlob.arrayBuffer();
    }
  }

  postMessage(
    {
      taskId,
      type: "result",
      result: {
        buffer,
        mime: mimeFromFormat(settings.format),
        bytes: buffer.byteLength,
        width: output.width,
        height: output.height,
        method: usedWasm ? "worker-wasm" : "worker-canvas",
      },
    },
    [buffer],
  );
}

self.addEventListener("message", async (event) => {
  const { taskId, file, settings } = event.data || {};
  try {
    await processTask(taskId, { file, settings });
  } catch (error) {
    postMessage({ taskId, type: "error", message: error?.message || "Worker processing failed." });
  }
});

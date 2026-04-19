import { jsPDF } from "jspdf";
import { buildFilename } from "./fabricHelpers.js";

export function sanitizeFilename(name = "design.png") {
  return String(name).trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getExportMime(format) {
  if (format === "png") return "image/png";
  if (format === "jpeg" || format === "jpg") return "image/jpeg";
  if (format === "svg") return "image/svg+xml";
  if (format === "pdf") return "application/pdf";
  return "application/octet-stream";
}

export function calculateExportDimensions(width, height, multiplier = 1) {
  return { w: Math.round(width * multiplier), h: Math.round(height * multiplier) };
}

export function estimateFileSize(width, height, multiplier = 1, quality = 0.92) {
  const { w, h } = calculateExportDimensions(width, height, multiplier);
  const bytes = Math.round(w * h * 4 * quality * 0.35);
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportPNG(canvas, filename, multiplier = 1, backgroundColor) {
  const dataUrl = canvas.toDataURL({
    format: "png",
    multiplier,
    enableRetinaScaling: true,
    ...(backgroundColor ? { backgroundColor } : {}),
  });
  const blob = dataUrlToBlob(dataUrl);
  downloadBlob(blob, buildFilename(filename, "png"));
}

export function exportJPEG(canvas, filename, multiplier = 1, quality = 0.9, backgroundColor = "#ffffff") {
  const dataUrl = canvas.toDataURL({
    format: "jpeg",
    multiplier,
    quality,
    backgroundColor,
    enableRetinaScaling: true,
  });
  const blob = dataUrlToBlob(dataUrl);
  downloadBlob(blob, buildFilename(filename, "jpeg"));
}

export function exportSVG(canvas, filename) {
  const svg = canvas.toSVG();
  const blob = new Blob([svg], { type: getExportMime("svg") });
  downloadBlob(blob, buildFilename(filename, "svg"));
}

export function exportPDF(canvas, filename, options = {}) {
  const orientation = options.orientation || "landscape";
  const pdfW = options.width || canvas.getWidth();
  const pdfH = options.height || canvas.getHeight();
  const imgData = canvas.toDataURL({ format: "png", multiplier: options.multiplier || 2 });
  const pdf = new jsPDF({ orientation, unit: "px", format: [pdfW, pdfH] });
  pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
  pdf.save(buildFilename(filename, "pdf"));
}

function dataUrlToBlob(dataUrl) {
  const [header, body] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "application/octet-stream";
  const binary = window.atob(body);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

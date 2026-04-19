export function sanitizePdfFilename(name) {
  return String(name || "document")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "document";
}

export function calculateImagePosition({
  pageW,
  pageH,
  imageW,
  imageH,
  margin = 0,
  mode = "fit",
}) {
  const innerW = Math.max(1, pageW - margin * 2);
  const innerH = Math.max(1, pageH - margin * 2);

  if (mode === "fill") {
    return { x: margin, y: margin, w: innerW, h: innerH };
  }

  const scale = Math.min(innerW / imageW, innerH / imageH);
  const w = imageW * scale;
  const h = imageH * scale;
  const x = margin + (innerW - w) / 2;
  const y = margin + (innerH - h) / 2;
  return { x, y, w, h };
}

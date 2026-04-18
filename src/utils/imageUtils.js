export function num(v, min = 1) {
  const parsed = Number.parseInt(v, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.max(min, parsed);
}

export function bytesToText(bytes) {
  if (!bytes) return "-";
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function getOutputDimensions(settings, sourceWidth, sourceHeight) {
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

export function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

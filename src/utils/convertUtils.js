import { getSupportedFormats, isCodecSupported } from "./codecCapabilities.js";

const FORMAT_META = {
  jpeg: {
    ext: "jpeg",
    mime: "image/jpeg",
    label: "JPEG",
    color: "#F97316",
    lossy: true,
    supportsTransparency: false,
    jSquashModule: "@jsquash/jpeg",
  },
  png: {
    ext: "png",
    mime: "image/png",
    label: "PNG",
    color: "#3B82F6",
    lossy: false,
    supportsTransparency: true,
    jSquashModule: "@jsquash/png",
  },
  webp: {
    ext: "webp",
    mime: "image/webp",
    label: "WebP",
    color: "#22C55E",
    lossy: true,
    supportsTransparency: true,
    jSquashModule: "@jsquash/webp",
  },
  avif: {
    ext: "avif",
    mime: "image/avif",
    label: "AVIF",
    color: "#A855F7",
    lossy: true,
    supportsTransparency: true,
    jSquashModule: "@jsquash/avif",
  },
  gif: {
    ext: "gif",
    mime: "image/gif",
    label: "GIF",
    color: "#EC4899",
    lossy: false,
    supportsTransparency: true,
    jSquashModule: null,
  },
  bmp: {
    ext: "bmp",
    mime: "image/bmp",
    label: "BMP",
    color: "#6B7280",
    lossy: false,
    supportsTransparency: false,
    jSquashModule: null,
  },
  ico: {
    ext: "ico",
    mime: "image/x-icon",
    label: "ICO",
    color: "#F59E0B",
    lossy: false,
    supportsTransparency: true,
    jSquashModule: null,
  },
  tiff: {
    ext: "tiff",
    mime: "image/tiff",
    label: "TIFF",
    color: "#14B8A6",
    lossy: false,
    supportsTransparency: true,
    jSquashModule: null,
  },
  svg: {
    ext: "svg",
    mime: "image/svg+xml",
    label: "SVG",
    color: "#EF4444",
    lossy: false,
    supportsTransparency: true,
    jSquashModule: null,
  },
};

export const INPUT_FORMATS = ["jpeg", "png", "webp", "gif", "tiff", "bmp", "avif", "ico", "svg"];
export const OUTPUT_FORMATS = ["jpeg", "png", "webp", "avif", "gif", "bmp", "ico", "tiff"];

export function normalizeFormat(raw) {
  if (!raw) return null;
  const lowered = String(raw).toLowerCase().trim();
  if (lowered === "jpg") return "jpeg";
  if (lowered === "tif") return "tiff";
  if (FORMAT_META[lowered]) return lowered;
  return null;
}

export function getFormatMeta(format) {
  const normalized = normalizeFormat(format);
  return normalized ? FORMAT_META[normalized] : null;
}

export function formatLabel(format) {
  return getFormatMeta(format)?.label || String(format || "").toUpperCase();
}

export function isLossyFormat(format) {
  return Boolean(getFormatMeta(format)?.lossy);
}

export function needsBackgroundFill(srcFormat, outFormat) {
  const srcMeta = getFormatMeta(srcFormat);
  const outMeta = getFormatMeta(outFormat);
  if (!srcMeta || !outMeta) return false;
  return srcMeta.supportsTransparency && !outMeta.supportsTransparency;
}

export function canConvert(srcFormat, outFormat) {
  const src = normalizeFormat(srcFormat);
  const out = normalizeFormat(outFormat);
  if (!src || !out) return false;
  if (!INPUT_FORMATS.includes(src)) return false;
  if (!OUTPUT_FORMATS.includes(out)) return false;
  if (src === "svg" && out === "ico") return false;
  return true;
}

export function getFormatAccept() {
  return INPUT_FORMATS.map((fmt) => FORMAT_META[fmt].mime).join(",");
}

export function fileToFormat(file) {
  const fromMime = normalizeFormat(file?.type?.split("/")[1]);
  if (fromMime) return fromMime;

  const ext = file?.name?.split(".").pop()?.toLowerCase();
  return normalizeFormat(ext) || "png";
}

export function getAllFormatMeta() {
  return { ...FORMAT_META };
}

export function getSupportedOutputFormats() {
  return OUTPUT_FORMATS.filter((fmt) => {
    const meta = getFormatMeta(fmt);
    if (!meta) return false;
    if (!meta.jSquashModule) return false;
    return isCodecSupported(fmt);
  });
}

export function getSupportedInputFormats() {
  const supported = new Set(getSupportedFormats());
  return INPUT_FORMATS.filter((fmt) => {
    const meta = getFormatMeta(fmt);
    if (!meta) return false;
    if (!meta.jSquashModule) return true;
    return supported.has(fmt);
  });
}

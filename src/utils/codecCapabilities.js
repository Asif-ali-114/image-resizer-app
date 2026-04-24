const codecSupport = new Map([
  ["jpeg", true],
  ["png", true],
  ["webp", true],
  ["avif", false],
]);

let probePromise = null;

function normalizeFormat(format) {
  const lowered = String(format || "").toLowerCase();
  if (lowered === "jpg") return "jpeg";
  return lowered;
}

function makeProbeImageData(values) {
  const ImageDataCtor = globalThis.ImageData;
  if (!ImageDataCtor) throw new Error("ImageData unavailable");
  return new ImageDataCtor(new Uint8ClampedArray(values), 1, 1);
}

async function probeJpeg() {
  if (canEncodeMime("image/jpeg")) return true;
  try {
    const mod = await import("@jsquash/jpeg");
    if (typeof mod.encode !== "function") throw new Error("jpeg encode unavailable");
    await mod.encode(makeProbeImageData([255, 0, 0, 255]), { quality: 80 });
    return true;
  } catch {
    return false;
  }
}

async function probePng() {
  if (canEncodeMime("image/png")) return true;
  try {
    const mod = await import("@jsquash/png");
    if (typeof mod.encode !== "function") throw new Error("png encode unavailable");
    await mod.encode(makeProbeImageData([0, 255, 0, 255]));
    return true;
  } catch {
    return false;
  }
}

async function probeWebp() {
  if (canEncodeMime("image/webp")) return true;
  try {
    const mod = await import("@jsquash/webp");
    if (typeof mod.encode !== "function") throw new Error("webp encode unavailable");
    await mod.encode(makeProbeImageData([0, 0, 255, 255]), { quality: 80 });
    return true;
  } catch {
    return false;
  }
}

async function probeAvif() {
  if (canEncodeMime("image/avif")) return true;
  try {
    const mod = await import("@jsquash/avif");
    if (typeof mod.encode !== "function") throw new Error("avif encode unavailable");
    await mod.encode(makeProbeImageData([255, 255, 0, 255]), { quality: 80 });
    return true;
  } catch {
    return false;
  }
}

function canEncodeMime(mime) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL(mime);
    return typeof dataUrl === "string" && dataUrl.startsWith(`data:${mime}`);
  } catch {
    return false;
  }
}

export async function probeCodecs() {
  if (probePromise) return probePromise;

  probePromise = (async () => {
    const probes = {
      jpeg: probeJpeg,
      png: probePng,
      webp: probeWebp,
      avif: probeAvif,
    };

    for (const [name, probe] of Object.entries(probes)) {
      try {
        const supported = await probe();
        codecSupport.set(name, Boolean(supported));
      } catch {
        codecSupport.set(name, false);
      }
    }

    return codecSupport;
  })();

  return probePromise;
}

export function isCodecSupported(format) {
  const normalized = normalizeFormat(format);
  return Boolean(codecSupport.get(normalized));
}

export function getSupportedFormats() {
  return Array.from(codecSupport.entries())
    .filter(([, supported]) => supported)
    .map(([name]) => name);
}

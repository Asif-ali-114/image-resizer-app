const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"];

function readMagicBytes(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = () => reject(new Error("Unable to inspect file"));
    reader.readAsArrayBuffer(file.slice(0, 16));
  });
}

export function magicTypeFromHeader(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export async function validateImageFile(file, { maxBytes = 20 * 1024 * 1024 } = {}) {
  if (!file) return { ok: false, message: "Missing file." };
  if (file.size === 0) return { ok: false, message: "File appears to be empty." };
  if (file.size > maxBytes) return { ok: false, message: "File exceeds 20MB limit." };
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return { ok: false, message: "Format not supported. Accepted: JPG, PNG, WebP, GIF, BMP, TIFF" };
  }

  if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    const header = await readMagicBytes(file);
    const magicType = magicTypeFromHeader(header);
    if (!magicType || magicType !== file.type) {
      return { ok: false, message: "File signature does not match MIME type." };
    }
  }

  return { ok: true };
}

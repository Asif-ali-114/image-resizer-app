export function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("data:image/")) return true;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif|bmp|tiff|tif|avif|ico|svg)$/.test(path) || parsed.search.length > 0;
  } catch {
    return false;
  }
}

export function inferFilenameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").pop();
    if (last && /\./.test(last)) return decodeURIComponent(last);
    return "imported-image";
  } catch {
    return "imported-image";
  }
}

async function toImageMeta(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const next = new Image();
      next.onload = () => resolve(next);
      next.onerror = () => reject(new Error("Could not parse image dimensions."));
      next.src = objectUrl;
    });

    return {
      file,
      width: img.width,
      height: img.height,
      format: file.type || "image/unknown",
      size: file.size,
      previewUrl: objectUrl,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export async function fetchImageFromUrl(url) {
  if (!isValidImageUrl(url)) {
    throw new Error("Invalid image URL.");
  }

  if (url.startsWith("data:image/")) {
    const response = await globalThis.fetch(url);
    const blob = await response.blob();
    const name = inferFilenameFromUrl("https://local/imported-image");
    const file = new globalThis.File([blob], name, { type: blob.type || "image/png" });
    return toImageMeta(file);
  }

  const attempts = [url, `https://corsproxy.io/?url=${encodeURIComponent(url)}`];
  let lastError = null;

  for (const target of attempts) {
    try {
      const response = await globalThis.fetch(target, { mode: "cors" });
      if (!response.ok) throw new Error(`Fetch failed (${response.status})`);
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        throw new Error("URL did not return an image.");
      }
      const blob = await response.blob();
      const file = new globalThis.File([blob], inferFilenameFromUrl(url), { type: blob.type || contentType });
      return await toImageMeta(file);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "Could not load image from URL.");
}

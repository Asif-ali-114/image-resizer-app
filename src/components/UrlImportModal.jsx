import { useEffect, useMemo, useState } from "react";
import Btn from "./Btn.jsx";
import Card from "./Card.jsx";
import { fetchImageFromUrl } from "../utils/urlImportUtils.js";
import { bytesToText } from "../utils/imageUtils.js";

export default function UrlImportModal({ open, onClose, onAdd }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!open && preview?.previewUrl) {
      URL.revokeObjectURL(preview.previewUrl);
      setPreview(null);
    }
  }, [open, preview]);

  const urls = useMemo(() => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean), [value]);

  if (!open) return null;

  const previewOne = async (url) => {
    setLoading(true);
    setError("");
    try {
      if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);
      const result = await fetchImageFromUrl(url);
      setPreview(result);
    } catch (err) {
      setError(err?.message || "Could not load image. Check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  const importAll = async () => {
    setLoading(true);
    setError("");
    const accepted = [];

    for (const url of urls) {
      try {
        const result = await fetchImageFromUrl(url);
        accepted.push(result.file);
        if (result.previewUrl) URL.revokeObjectURL(result.previewUrl);
      } catch {
        // keep importing other URLs
      }
    }

    setLoading(false);
    if (!accepted.length) {
      setError("None of the URLs could be imported.");
      return;
    }

    onAdd(accepted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/45 p-4" onClick={onClose}>
      <Card className="mx-auto mt-8 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold text-on-surface">Import Image from URL</h3>
          <button type="button" onClick={onClose} aria-label="Close URL import" className="rounded-full p-1 hover:bg-surface-container">×</button>
        </div>

        <label className="text-sm text-on-surface-variant">
          Image URL
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://example.com/image.jpg"
            aria-label="Image URL"
            className="mt-1 min-h-[80px] w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <Btn onClick={() => previewOne(urls[0])} disabled={!urls.length || loading} aria-label="Preview URL image">
            {loading ? "Fetching..." : "Preview"}
          </Btn>
          {urls.length > 1 && (
            <Btn variant="secondary" onClick={importAll} disabled={loading} aria-label={`Import all ${urls.length} URLs`}>
              Import All {urls.length}
            </Btn>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        {preview && (
          <div className="mt-4 rounded-lg border border-outline-variant/30 bg-surface-container-low p-3">
            <img src={preview.previewUrl} alt="URL preview" className="max-h-60 w-full rounded-lg object-contain" />
            <p className="mt-2 text-xs text-on-surface-variant">
              {preview.file.name} · {preview.width}×{preview.height} · {preview.format} · {bytesToText(preview.size)}
            </p>
            <div className="mt-2 flex justify-end">
              <Btn
                onClick={() => {
                  onAdd([preview.file]);
                  onClose();
                }}
                aria-label="Add preview image to queue"
              >
                Add to Queue →
              </Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { validateImageFile } from "../utils/fileValidation.js";
import { loadImageFromUrl } from "../utils/imageUtils.js";
import Btn from "../components/Btn.jsx";
import UrlImportModal from "../components/UrlImportModal.jsx";
import { blobRegistry } from "../utils/BlobRegistry.js";
import { iconProps, ToolClipboardPasteIcon, ToolImagePlusIcon } from "../components/AppIcons.jsx";
import AlertBox from "../components/AlertBox.jsx";


export default function UploadStep({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const inputRef = useRef(null);
  const previewTagRef = useRef(`upload-preview-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const previewTag = previewTagRef.current;
    return () => {
      blobRegistry.release(previewTag);
    };
  }, []);

  const processFile = useCallback(async (file) => {
    setError("");
    if (!file) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    try {
      const valid = await validateImageFile(file);
      if (!valid.ok) {
        setError(valid.message);
        return;
      }

      const url = URL.createObjectURL(file);
      const img = await loadImageFromUrl(url);
      if (img.width > 8000 || img.height > 8000) {
        URL.revokeObjectURL(url);
        setError("Resolution exceeds 8000x8000px limit.");
        return;
      }

      blobRegistry.replaceUrl(previewTagRef.current, url);
      setThumbUrl(url);
      onUpload({ file, url, w: img.width, h: img.height, size: file.size, name: file.name, type: file.type });
    } catch {
      setError("Could not read image. File may be corrupt.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [onUpload]);

  const onPaste = useCallback(
    (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          processFile(item.getAsFile());
          break;
        }
      }
    },
    [processFile]
  );

  useEffect(() => {
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [onPaste]);

  return (
    <div className="w-full max-w-2xl mx-auto px-2 md:px-0">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          processFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 ${
          dragging
            ? "border-primary bg-primary/5 scale-105"
            : "border-primary bg-primary/2 hover:border-primary/80 hover:bg-primary/3"
        }`}
      >
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary md:h-20 md:w-20">
          <ToolImagePlusIcon {...iconProps} size={30} />
        </div>
        <h2 className="text-xl md:text-2xl font-headline font-bold text-on-surface mb-2">Drop your image here</h2>
        <p className="text-on-surface-variant text-sm md:text-base mb-6">
          or click to browse · paste with <kbd className="px-2 py-1 bg-surface-container rounded text-xs font-mono">Ctrl+V</kbd>
        </p>
        <div className="inline-block px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary-dim transition-colors">
          Choose File
        </div>
        <div className="mt-3">
          <Btn
            small
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation();
              setUrlModalOpen(true);
            }}
          >
            Import from URL
          </Btn>
        </div>
        <p className="text-on-surface-variant text-xs md:text-sm mt-6">
          JPG · PNG · WebP · GIF · BMP · TIFF · Max 20MB · Max 8000x8000px
        </p>
      </div>

      {thumbUrl && (
        <div className="mt-8 flex justify-center">
          <div className="relative group">
            <img
              src={thumbUrl}
              alt="Selected preview"
              className="max-w-xs md:max-w-sm max-h-64 rounded-lg shadow-lg border border-outline-variant/30 group-hover:shadow-xl transition-shadow"
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}

      <AlertBox msg={error} />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => processFile(e.target.files[0])}
      />

      <div className="mt-6 md:mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-on-surface-variant">
        <strong className="inline-flex items-center gap-2 text-primary"><ToolClipboardPasteIcon {...iconProps} size={14} />Shortcuts:</strong> Ctrl+V paste · Tab navigate · Enter confirm
      </div>

      <UrlImportModal
        open={urlModalOpen}
        onClose={() => setUrlModalOpen(false)}
        onAdd={(files) => processFile(files[0])}
      />
    </div>
  );
}

import { useRef } from "react";
import Btn from "../../Btn.jsx";

export default function ImagesPanel({ images, onUploadImages, onAddImageToCanvas }) {
  const inputRef = useRef(null);

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--logo-muted)]">Images</h4>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          if (files.length) onUploadImages(files);
          event.target.value = "";
        }}
      />
      <Btn className="w-full" onClick={() => inputRef.current?.click()} aria-label="Upload image">+ Upload Image</Btn>
      <div className="grid grid-cols-3 gap-2">
        {images.map((image) => (
          <button key={image.id} type="button" aria-label={`Add image ${image.name}`} className="logo-press rounded border p-1" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }} onClick={() => onAddImageToCanvas(image)}>
            <img src={image.url} alt={image.name} className="h-16 w-full rounded object-cover" />
          </button>
        ))}
      </div>
      {images.length === 0 && <p className="text-xs text-[var(--logo-muted)]">Upload images to start building designs.</p>}
    </div>
  );
}

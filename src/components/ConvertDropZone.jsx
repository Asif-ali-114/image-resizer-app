import { useRef } from "react";
import { getFormatAccept } from "../utils/convertUtils.js";

export default function ConvertDropZone({
  dragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onPick,
  onImportUrl,
}) {
  const inputRef = useRef(null);

  const handleOpen = () => inputRef.current?.click();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop images here or click to browse"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen();
        }
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={handleOpen}
      className={`rounded-2xl border-2 p-8 text-center transition-all duration-150 sm:p-10 ${
        dragging
          ? "border-primary bg-primary/10"
          : "border-dashed border-outline-variant/50 bg-surface-container-low"
      }`}
      style={
        dragging
          ? {
              borderStyle: "solid",
              background: "rgb(var(--color-background-info, 227 242 253) / 0.5)",
            }
          : undefined
      }
    >
      <div className={`mx-auto mb-4 h-14 w-14 text-on-surface-variant transition-transform duration-150 ${dragging ? "scale-110 text-primary" : "scale-100"}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
          <path d="M12 3v12" />
          <path d="m7 8 5-5 5 5" />
          <rect x="4" y="15" width="16" height="6" rx="2" />
        </svg>
      </div>
      <p className="text-base font-bold text-on-surface">Drop images here or click to browse</p>
      <p className="mt-2 text-xs text-on-surface-variant">Supports: JPEG, PNG, WebP, GIF, TIFF, BMP, AVIF, ICO, SVG</p>
      <p className="mt-1 text-xs text-on-surface-variant">Drag multiple files or paste from clipboard (Ctrl+V)</p>
      {onImportUrl && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onImportUrl();
          }}
          className="mt-3 rounded-lg border border-outline-variant/40 bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface"
        >
          Import from URL
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={getFormatAccept()}
        multiple
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />
    </div>
  );
}

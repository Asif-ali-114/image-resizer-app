import { useMemo, useState } from "react";
import Btn from "../../Btn.jsx";
import Card from "../../Card.jsx";
import { estimateFileSize } from "../../../utils/logo/exportUtils.js";

export default function ExportModal({ open, onClose, canvasWidth, canvasHeight, onExport }) {
  const [filename, setFilename] = useState("logo_design");
  const [format, setFormat] = useState("png");
  const [multiplier, setMultiplier] = useState(2);
  const [quality, setQuality] = useState(90);
  const [orientation, setOrientation] = useState("landscape");
  const [bgMode, setBgMode] = useState("current");
  const [jpegBg, setJpegBg] = useState("#ffffff");

  const estimate = useMemo(() => estimateFileSize(canvasWidth, canvasHeight, multiplier, quality / 100), [canvasWidth, canvasHeight, multiplier, quality]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220] bg-black/50" onClick={onClose} role="presentation">
      <div className="mx-auto mt-10 w-[min(560px,calc(100%-24px))]" onClick={(e) => e.stopPropagation()}>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-on-surface">Export Design</h3>
            <Btn small variant="secondary" onClick={onClose}>Close</Btn>
          </div>

          <label className="text-xs text-on-surface-variant">Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="svg">SVG</option>
            <option value="pdf">PDF</option>
          </select>

          <label className="mt-2 block text-xs text-on-surface-variant">Filename</label>
          <input value={filename} onChange={(e) => setFilename(e.target.value)} />

          {(format === "png" || format === "jpeg") && (
            <>
              <label className="mt-2 block text-xs text-on-surface-variant">Scale</label>
              <select value={String(multiplier)} onChange={(e) => setMultiplier(Number(e.target.value))}>
                {[1, 2, 3, 4].map((m) => <option key={m} value={m}>{m}x</option>)}
              </select>
            </>
          )}

          {format === "png" && (
            <>
              <label className="mt-2 block text-xs text-on-surface-variant">Background</label>
              <select value={bgMode} onChange={(e) => setBgMode(e.target.value)}>
                <option value="current">Current background</option>
                <option value="white">White</option>
                <option value="transparent">Transparent</option>
              </select>
            </>
          )}

          {format === "jpeg" && (
            <>
              <label className="mt-2 block text-xs text-on-surface-variant">Quality ({quality})</label>
              <input type="range" min="1" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
              <label className="mt-2 block text-xs text-on-surface-variant">Background</label>
              <input type="color" value={jpegBg} onChange={(e) => setJpegBg(e.target.value)} />
            </>
          )}

          {format === "pdf" && (
            <>
              <label className="mt-2 block text-xs text-on-surface-variant">Orientation</label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </>
          )}

          <p className="mt-3 text-xs text-on-surface-variant">Estimated file size: {estimate}</p>

          <div className="mt-4 flex justify-end gap-2">
            <Btn small variant="secondary" onClick={onClose}>Cancel</Btn>
            <Btn
              small
              onClick={() => onExport({ format, filename, multiplier, quality: quality / 100, orientation, bgMode, jpegBg })}
            >
              Download {format.toUpperCase()}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

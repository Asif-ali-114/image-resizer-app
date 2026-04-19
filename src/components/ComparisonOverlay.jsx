import Btn from "./Btn.jsx";
import ComparisonSlider from "./ComparisonSlider.jsx";

export default function ComparisonOverlay({ open, onClose, ...sliderProps }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] bg-black/70 p-4" onClick={onClose}>
      <div className="mx-auto flex h-full max-w-6xl flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex justify-end">
          <Btn variant="secondary" onClick={onClose} aria-label="Close fullscreen comparison">Close</Btn>
        </div>
        <div className="flex-1 overflow-hidden rounded-xl bg-surface-container-lowest p-3">
          <ComparisonSlider {...sliderProps} width="100%" height="100%" />
        </div>
      </div>
    </div>
  );
}

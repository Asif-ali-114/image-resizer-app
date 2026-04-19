import { useEffect, useState } from "react";
import Btn from "../../Btn.jsx";
import Card from "../../Card.jsx";

export default function CanvasSizeModal({ open, width, height, onClose, onApply }) {
  const [w, setW] = useState(width);
  const [h, setH] = useState(height);

  useEffect(() => {
    setW(width);
    setH(height);
  }, [width, height, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[210] bg-black/50" onClick={onClose} role="presentation">
      <div className="mx-auto mt-20 w-[min(420px,calc(100%-24px))]" onClick={(e) => e.stopPropagation()}>
        <Card>
          <h3 className="text-lg font-semibold text-on-surface">Canvas Size</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <input type="number" value={w} onChange={(e) => setW(Number(e.target.value))} />
            <input type="number" value={h} onChange={(e) => setH(Number(e.target.value))} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Btn small variant="secondary" onClick={onClose}>Cancel</Btn>
            <Btn small onClick={() => onApply(w, h)}>Apply</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

import Btn from "../../Btn.jsx";
import Card from "../../Card.jsx";

export default function SavedDesignsModal({ open, onClose, saves, onLoad, onDelete }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[210] bg-black/50" onClick={onClose} role="presentation">
      <div className="mx-auto mt-10 w-[min(860px,calc(100%-24px))]" onClick={(e) => e.stopPropagation()}>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Saved Designs</h3>
            <Btn small variant="secondary" onClick={onClose}>Close</Btn>
          </div>
          <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
            {saves.map((save) => (
              <div key={save.id} className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-2">
                <img src={save.thumbnail} alt={save.name} className="h-24 w-full rounded object-cover" />
                <p className="mt-2 text-sm font-medium">{save.name}</p>
                <p className="text-[11px] text-on-surface-variant">{new Date(save.timestamp).toLocaleString()}</p>
                <div className="mt-2 flex gap-2">
                  <Btn small onClick={() => onLoad(save)}>Load</Btn>
                  <Btn small variant="danger" onClick={() => onDelete(save.id)}>Delete</Btn>
                </div>
              </div>
            ))}
          </div>
          {saves.length === 0 && <p className="text-sm text-on-surface-variant">No saved designs yet.</p>}
        </Card>
      </div>
    </div>
  );
}

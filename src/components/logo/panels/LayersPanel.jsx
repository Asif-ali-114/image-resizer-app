import { getObjectLabel } from "../../../utils/logo/fabricHelpers.js";

export default function LayersPanel({ layers, selectedId, onSelectLayer, onDeleteLayer, onToggleVisibility, onToggleLock, onMoveLayerUp, onMoveLayerDown, onGroupSelected, onUngroupSelected, onDuplicateSelected, onDeleteSelected }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--logo-muted)]">Layers</h4>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" aria-label="Group selected layers" className="logo-press rounded border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }} onClick={onGroupSelected}>Group</button>
        <button type="button" aria-label="Ungroup selected layers" className="logo-press rounded border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }} onClick={onUngroupSelected}>Ungroup</button>
        <button type="button" aria-label="Duplicate selected layer" className="logo-press rounded border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }} onClick={onDuplicateSelected}>Duplicate</button>
        <button type="button" aria-label="Delete selected layer" className="logo-press rounded border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }} onClick={onDeleteSelected}>Delete</button>
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-1" style={{ borderColor: "var(--logo-border)" }}>
        {layers.map((layer, idx) => (
          <div key={layer.id} className="flex items-center gap-1 rounded px-1 py-1 text-xs" style={{ backgroundColor: selectedId === layer.id ? "var(--logo-accent-soft)" : "transparent" }}>
            <button type="button" title="Move up" onClick={() => onMoveLayerUp(layer.id)}>↑</button>
            <button type="button" title="Move down" onClick={() => onMoveLayerDown(layer.id)}>↓</button>
            <button type="button" title="Toggle visibility" onClick={() => onToggleVisibility(layer.id)}>{layer.visible ? "👁" : "🚫"}</button>
            <button type="button" title="Toggle lock" onClick={() => onToggleLock(layer.id)}>{layer.locked ? "🔒" : "🔓"}</button>
            <button type="button" aria-label={`Select ${getObjectLabel(layer.object)} layer`} className="flex-1 truncate text-left text-[var(--logo-text)]" onClick={() => onSelectLayer(layer.id)}>
              {getObjectLabel(layer.object)} {layers.length - idx}
            </button>
            <button type="button" title="Delete layer" onClick={() => onDeleteLayer(layer.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

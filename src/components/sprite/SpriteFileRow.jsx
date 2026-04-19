import DragHandle from "../DragHandle.jsx";

export default function SpriteFileRow({ item, index, onRemove, dragApi }) {
  return (
    <div
      draggable
      onDragStart={() => dragApi.dragHandlers.onDragStart(index)}
      onDragOver={(e) => dragApi.dragHandlers.onDragOver(e, index)}
      onDrop={() => dragApi.dragHandlers.onDrop(index)}
      onDragEnd={dragApi.dragHandlers.onDragEnd}
      className={`flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low p-2 transition ${dragApi.dragOverIndex === index ? "ring-2 ring-primary" : ""}`}
    >
      <DragHandle dragging={dragApi.isDragging} ariaLabel={`Drag ${item.name}`} />
      <img src={item.url} alt={item.name} className="h-10 w-10 rounded object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-on-surface">{item.name}</p>
        <p className="text-xs text-on-surface-variant">{item.width}×{item.height} · ({item.x || 0}, {item.y || 0})</p>
      </div>
      <button type="button" onClick={() => onRemove(index)} className="rounded-full p-1 text-error hover:bg-error/10" aria-label={`Remove ${item.name}`}>×</button>
    </div>
  );
}

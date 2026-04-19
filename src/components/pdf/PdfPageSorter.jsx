import DragHandle from "../DragHandle.jsx";
import PdfPagePreview from "./PdfPagePreview.jsx";

export default function PdfPageSorter({ pages, selectedIndex, onSelect, onRemove, dragApi }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {pages.map((page, index) => (
        <div
          key={page.id}
          draggable
          onDragStart={() => dragApi.dragHandlers.onDragStart(index)}
          onDragOver={(e) => dragApi.dragHandlers.onDragOver(e, index)}
          onDrop={() => dragApi.dragHandlers.onDrop(index)}
          onDragEnd={dragApi.dragHandlers.onDragEnd}
          className={`rounded-lg transition ${dragApi.dragOverIndex === index ? "ring-2 ring-primary" : ""}`}
        >
          <div className="mb-1 flex items-center gap-1 text-on-surface-variant">
            <DragHandle dragging={dragApi.isDragging} ariaLabel="Drag PDF page" />
            <span className="text-[11px]">Page {index + 1}</span>
          </div>
          <PdfPagePreview page={page} index={index} selected={selectedIndex === index} onSelect={onSelect} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

export default function PdfPagePreview({ page, index, selected, onSelect, onRemove }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      className={`relative rounded-lg border p-2 text-left ${selected ? "border-primary" : "border-outline-variant/30"}`}
      aria-label={`Select PDF page ${index + 1}`}
    >
      <img src={page.url} alt={page.name} className="h-28 w-full rounded object-cover" />
      <p className="mt-1 truncate text-xs text-on-surface">{index + 1}. {page.name}</p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        aria-label={`Remove ${page.name}`}
        className="absolute right-2 top-2 rounded-full bg-black/50 px-1.5 text-xs text-white"
      >
        ×
      </button>
    </button>
  );
}

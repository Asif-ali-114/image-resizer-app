export default function DragHandle({ ariaLabel = "Drag to reorder", dragging = false, ...rest }) {
  return (
    <span
      aria-label={ariaLabel}
      className={`inline-flex h-5 w-5 cursor-${dragging ? "grabbing" : "grab"} items-center justify-center text-on-surface-variant transition-colors hover:text-on-surface`}
      {...rest}
    >
      ≡
    </span>
  );
}

import { useMemo, useRef, useState } from "react";

export function reorder(items, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export default function useDragToReorder({ items, onReorder }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(-1);
  const dragIndexRef = useRef(-1);
  const longPressRef = useRef(0);

  const dragHandlers = useMemo(() => ({
    draggable: true,
    onDragStart: (index) => {
      dragIndexRef.current = index;
      setIsDragging(true);
    },
    onDragOver: (event, index) => {
      event.preventDefault();
      setDragOverIndex(index);
    },
    onDrop: (index) => {
      const from = dragIndexRef.current;
      const to = index;
      setIsDragging(false);
      setDragOverIndex(-1);
      if (from < 0 || to < 0 || from === to) return;
      onReorder(reorder(items, from, to));
    },
    onDragEnd: () => {
      setIsDragging(false);
      setDragOverIndex(-1);
    },
  }), [items, onReorder]);

  const handleHandlers = useMemo(() => ({
    onPointerDown: (startDrag) => {
      longPressRef.current = window.setTimeout(() => {
        startDrag();
      }, 300);
    },
    onPointerUp: () => {
      window.clearTimeout(longPressRef.current);
    },
    onPointerLeave: () => {
      window.clearTimeout(longPressRef.current);
    },
  }), []);

  return { dragHandlers, handleHandlers, isDragging, dragOverIndex };
}

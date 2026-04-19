import Card from "./Card.jsx";

const SHORTCUTS = [
  ["Ctrl+V", "Paste image from clipboard"],
  ["Ctrl+Z", "Undo (Editor tab)"],
  ["Ctrl+Y", "Redo (Editor tab)"],
  ["Enter", "Process/Convert/Generate"],
  ["Escape", "Close modal"],
  ["Arrow keys", "Move comparison slider"],
  ["Delete", "Remove selected file"],
];

export default function ShortcutsModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] bg-black/50 p-4" onClick={onClose}>
      <Card className="mx-auto mt-10 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold text-on-surface">Keyboard Shortcuts</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-surface-container" aria-label="Close shortcuts">×</button>
        </div>
        <ul className="space-y-2">
          {SHORTCUTS.map(([keys, desc]) => (
            <li key={keys} className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2 text-sm">
              <span className="font-mono font-bold text-primary">{keys}</span>
              <span className="text-on-surface-variant">{desc}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

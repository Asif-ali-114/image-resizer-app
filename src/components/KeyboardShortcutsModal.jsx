import { useEffect } from "react";
import Btn from "./Btn.jsx";
import Card from "./Card.jsx";

function Badge({ text }) {
  return <span className="ui-badge font-mono">{text}</span>;
}

function ShortcutRow({ label, keys }) {
  return (
    <div className="flex min-h-10 items-center justify-between border-b py-2 text-sm" style={{ borderColor: "var(--color-base-200)" }}>
      <span>{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((key) => <Badge key={key} text={key} />)}
      </span>
    </div>
  );
}

function Section({ title, rows }) {
  return (
    <div className="mb-4">
      <p className="section-label pb-2 pt-4">{title}</p>
      <Card className="p-3">
        {rows.map((row) => <ShortcutRow key={row.label} label={row.label} keys={row.keys} />)}
      </Card>
    </div>
  );
}

const SECTIONS = [
  {
    title: "Global",
    rows: [
      { label: "Open Command Palette", keys: ["Ctrl", "K"] },
      { label: "Open Keyboard Shortcuts", keys: ["Ctrl", "/"] },
      { label: "Toggle Dark Mode", keys: ["Ctrl", "Shift", "L"] },
      { label: "Go Back to Home", keys: ["Esc"] },
      { label: "Paste Image", keys: ["Ctrl", "V"] },
    ],
  },
  {
    title: "Command Palette",
    rows: [
      { label: "Navigate Results", keys: ["↑", "↓"] },
      { label: "Open Selected Tool", keys: ["Enter"] },
      { label: "Close Palette", keys: ["Esc"] },
    ],
  },
  {
    title: "Image Editor",
    rows: [
      { label: "Undo Last Change", keys: ["Ctrl", "Z"] },
      { label: "Redo", keys: ["Ctrl", "Y"] },
      { label: "Reset All Adjustments", keys: ["Ctrl", "Shift", "R"] },
      { label: "Save and Download", keys: ["Ctrl", "S"] },
      { label: "Rotate Left", keys: ["Ctrl", "["] },
      { label: "Rotate Right", keys: ["Ctrl", "]"] },
    ],
  },
  {
    title: "Comparison Slider",
    rows: [
      { label: "Move Divider", keys: ["←", "→"] },
      { label: "Jump to Start / End", keys: ["Home", "End"] },
      { label: "Toggle Orientation", keys: ["O"] },
      { label: "Toggle Fullscreen", keys: ["F"] },
    ],
  },
  {
    title: "File Queues",
    rows: [
      { label: "Start Processing", keys: ["Enter"] },
      { label: "Clear All Files", keys: ["Ctrl", "Shift", "X"] },
      { label: "Remove Selected File", keys: ["Delete"] },
      { label: "Add More Files", keys: ["Ctrl", "O"] },
    ],
  },
  {
    title: "Color Palette",
    rows: [
      { label: "Re-extract Colors", keys: ["Ctrl", "Enter"] },
      { label: "Export as CSS", keys: ["Ctrl", "Shift", "C"] },
    ],
  },
  {
    title: "Logo Creator",
    rows: [
      { label: "Undo / Redo", keys: ["Ctrl", "Z", "/", "Ctrl", "Y"] },
      { label: "Save Design", keys: ["Ctrl", "S"] },
      { label: "Open Export", keys: ["Ctrl", "Shift", "S"] },
      { label: "Copy / Paste / Duplicate", keys: ["Ctrl", "C", "/", "Ctrl", "V", "/", "Ctrl", "D"] },
      { label: "Delete Selected", keys: ["Delete"] },
      { label: "Select All", keys: ["Ctrl", "A"] },
      { label: "Zoom In / Out", keys: ["Ctrl", "+", "/", "Ctrl", "-"] },
      { label: "Toggle Grid", keys: ["G"] },
      { label: "Toggle Preview", keys: ["F"] },
      { label: "Nudge / Fast Nudge", keys: ["Arrows", "/", "Shift", "Arrows"] },
    ],
  },
];

export default function KeyboardShortcutsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-black/50" onClick={onClose} role="presentation">
      <div
        className="mx-auto mt-8 max-h-[80vh] w-[calc(100%-24px)] max-w-[640px] overflow-y-auto rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-card md:mt-20"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">⌨ Keyboard Shortcuts</h2>
          <Btn small variant="secondary" onClick={onClose} aria-label="Close keyboard shortcuts">×</Btn>
        </div>

        {SECTIONS.map((section) => (
          <Section key={section.title} title={section.title} rows={section.rows} />
        ))}
      </div>
    </div>
  );
}

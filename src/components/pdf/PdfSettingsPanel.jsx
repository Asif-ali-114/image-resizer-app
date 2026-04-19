import Card from "../Card.jsx";

export default function PdfSettingsPanel({ settings, setSettings }) {
  return (
    <Card>
      <div className="space-y-3 text-sm">
        <label className="block text-xs text-on-surface-variant">
          Page Size
          <select value={settings.pageSize} onChange={(e) => setSettings((s) => ({ ...s, pageSize: e.target.value }))} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="PDF page size">
            {[
              ["a4", "A4"],
              ["a3", "A3"],
              ["letter", "Letter"],
              ["legal", "Legal"],
            ].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <label className="block text-xs text-on-surface-variant">
          Orientation
          <select value={settings.orientation} onChange={(e) => setSettings((s) => ({ ...s, orientation: e.target.value }))} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="PDF orientation">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>

        <label className="block text-xs text-on-surface-variant">
          Margin (mm)
          <input type="number" value={settings.margin} onChange={(e) => setSettings((s) => ({ ...s, margin: Number(e.target.value) || 0 }))} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="PDF margin" />
        </label>

        <label className="block text-xs text-on-surface-variant">
          Image Fit
          <select value={settings.fitMode} onChange={(e) => setSettings((s) => ({ ...s, fitMode: e.target.value }))} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="PDF image fit mode">
            <option value="fit">Fit to page</option>
            <option value="fill">Fill page</option>
          </select>
        </label>

        <label className="block text-xs text-on-surface-variant">
          PDF Title
          <input value={settings.title} onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="PDF title" />
        </label>

        <label className="block text-xs text-on-surface-variant">
          Author
          <input value={settings.author} onChange={(e) => setSettings((s) => ({ ...s, author: e.target.value }))} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="PDF author" />
        </label>
      </div>
    </Card>
  );
}

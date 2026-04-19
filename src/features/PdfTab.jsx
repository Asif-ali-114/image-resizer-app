import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import Btn from "../components/Btn.jsx";
import Card from "../components/Card.jsx";
import UrlImportModal from "../components/UrlImportModal.jsx";
import PdfSettingsPanel from "../components/pdf/PdfSettingsPanel.jsx";
import PdfPageSorter from "../components/pdf/PdfPageSorter.jsx";
import { calculateImagePosition, sanitizePdfFilename } from "../utils/pdfUtils.js";
import useDragToReorder from "../hooks/useDragToReorder.js";

function pageSizeToFormat(pageSize) {
  if (pageSize === "a3") return "a3";
  if (pageSize === "letter") return "letter";
  if (pageSize === "legal") return "legal";
  return "a4";
}

export default function PdfTab({ onNotice }) {
  const inputRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [selected, setSelected] = useState(0);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [making, setMaking] = useState(false);
  const [readyPdf, setReadyPdf] = useState(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [settings, setSettings] = useState({
    pageSize: "a4",
    orientation: "portrait",
    margin: 10,
    fitMode: "fit",
    title: "Image PDF",
    author: "ImageResizerPro",
  });

  const dragApi = useDragToReorder({ items: pages, onReorder: setPages });

  const addFiles = (list) => {
    const additions = Array.from(list || []).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPages((current) => [...current, ...additions]);
  };

  const generatePdf = useCallback(async () => {
    if (!pages.length) return;
    setMaking(true);
    setReadyPdf(null);
    setProgress({ done: 0, total: pages.length });

    const doc = new jsPDF({ orientation: settings.orientation, unit: "mm", format: pageSizeToFormat(settings.pageSize) });

    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i];
      const img = await new Promise((resolve, reject) => {
        const node = new Image();
        node.onload = () => resolve(node);
        node.onerror = () => reject(new Error("Image load failed"));
        node.src = page.url;
      });

      if (i > 0) doc.addPage();
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const pos = calculateImagePosition({ pageW, pageH, imageW: img.width, imageH: img.height, margin: settings.margin, mode: settings.fitMode });
      doc.addImage(page.url, "PNG", pos.x, pos.y, pos.w, pos.h);
      setProgress((current) => ({ ...current, done: i + 1 }));
    }

    doc.setProperties({ title: settings.title, author: settings.author });
    const blob = doc.output("blob");
    setReadyPdf(blob);
    setMaking(false);
    onNotice?.({ type: "success", message: "PDF is ready to download." });
  }, [onNotice, pages, settings]);

  const downloadPdf = () => {
    if (!readyPdf) return;
    const url = URL.createObjectURL(readyPdf);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizePdfFilename(settings.title)}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const summary = useMemo(() => readyPdf ? `${pages.length} pages · ${(readyPdf.size / 1024 / 1024).toFixed(2)} MB` : "", [pages.length, readyPdf]);

  useEffect(() => {
    const onShortcut = (event) => {
      if (event?.detail?.action === "pdf-generate") {
        event.preventDefault?.();
        if (!making && pages.length) {
          void generatePdf();
        }
      }
    };
    window.addEventListener("imagetools:shortcut", onShortcut);
    return () => window.removeEventListener("imagetools:shortcut", onShortcut);
  }, [generatePdf, making, pages.length]);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-headline text-3xl font-black text-on-surface">Images to PDF</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Add images, arrange pages, and download a PDF.</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <PdfSettingsPanel settings={settings} setSettings={setSettings} />

        <Card>
          <PdfPageSorter
            pages={pages}
            selectedIndex={selected}
            onSelect={setSelected}
            onRemove={(index) => {
              const target = pages[index];
              if (target?.url) URL.revokeObjectURL(target.url);
              setPages((current) => current.filter((_, i) => i !== index));
            }}
            dragApi={dragApi}
          />
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => inputRef.current?.click()} aria-label="Add images to PDF">+ Add More Images</Btn>
          <Btn variant="secondary" onClick={() => setUrlOpen(true)} aria-label="Import image URL for PDF">Import from URL</Btn>
          <Btn variant="ghost" onClick={() => {
            pages.forEach((item) => item.url && URL.revokeObjectURL(item.url));
            setPages([]);
            setReadyPdf(null);
          }} aria-label="Clear PDF pages">Clear All</Btn>
          <Btn onClick={generatePdf} disabled={!pages.length || making} aria-label="Generate PDF">{making ? "Generating..." : "Generate PDF →"}</Btn>
          {readyPdf && <Btn variant="success" onClick={downloadPdf} aria-label="Download generated PDF">↓ Download PDF</Btn>}
        </div>

        {making && (
          <div className="mt-3">
            <p className="text-xs text-on-surface-variant">Adding page {progress.done} of {progress.total}...</p>
            <div className="mt-1 h-2 rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {summary && <p className="mt-3 text-sm font-semibold text-on-surface">✓ PDF ready · {summary}</p>}
      </Card>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      <UrlImportModal open={urlOpen} onClose={() => setUrlOpen(false)} onAdd={addFiles} />
    </div>
  );
}

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import pkg from "../package.json";
import StepBar from "./components/StepBar.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import UploadStep from "./steps/UploadStep.jsx";
import ResizeStep from "./steps/ResizeStep.jsx";
import OutputStep from "./steps/OutputStep.jsx";
import { FORMAT_MIME, LOCAL_STORAGE_SETTINGS_KEY, LOCAL_STORAGE_THEME_KEY } from "./constants/formats.js";
import { bytesToText } from "./utils/imageUtils.js";

const BulkTab = lazy(() => import("./features/BulkTab.jsx"));
const CropStep = lazy(() => import("./steps/CropStep.jsx"));

function LoadingFallback() {
  return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
}

function sanitizeSettings(raw) {
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const next = raw && typeof raw === "object" ? raw : {};

  const quality = Number.isFinite(Number(next.quality)) ? Math.round(Number(next.quality)) : 85;
  const format = typeof next.format === "string" ? next.format.toLowerCase() : "jpeg";
  const jpgBackground = typeof next.jpgBackground === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(next.jpgBackground)
    ? next.jpgBackground
    : "#ffffff";
  const theme = next.theme === "light" || next.theme === "dark" ? next.theme : prefersDark ? "dark" : "light";

  return {
    quality: Math.min(100, Math.max(1, quality)),
    format: ["jpeg", "png", "webp"].includes(format) ? format : "jpeg",
    jpgBackground,
    theme,
  };
}

export default function App() {
  useMemo(() => {
    try {
      return sanitizeSettings(JSON.parse(localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY) || "{}"));
    } catch {
      return sanitizeSettings({});
    }
  }, []);

  const [tab, setTab] = useState("single");
  const [step, setStep] = useState(0);
  const [image, setImage] = useState(null);
  const [settings, setSettings] = useState(null);
  const [cropData, setCropData] = useState(null);
  const [notice, setNotice] = useState(null);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 2800);
    return () => clearTimeout(timer);
  }, [notice]);

  const reset = useCallback(() => {
    if (image?.url) URL.revokeObjectURL(image.url);
    setStep(0);
    setImage(null);
    setSettings(null);
    setCropData(null);
  }, [image]);

  useEffect(() => {
    return () => {
      if (image?.url) URL.revokeObjectURL(image.url);
    };
  }, [image]);

  const TABS = [
    { id: "single", label: "Single Image" },
    { id: "bulk", label: "Bulk Resize" },
  ];

  const handleTabChange = (nextTab) => {
    if (nextTab === tab) return;
    if (step > 0 && tab === "single") {
      reset();
      setNotice({ type: "info", message: "Current edit was reset after switching tabs." });
    }
    setTab(nextTab);
  };

  const heroMeta = {
    single: {
      title: "Optimize for Every Canvas",
      subtitle: "Single image resizing with crop, export controls, and high-quality output.",
      badge: `v${pkg.version}`,
    },
    bulk: {
      title: "Process Collections in One Pass",
      subtitle: "Drop multiple files, configure one output profile, and bundle results into a ZIP.",
      badge: "Batch Ready",
    },
  }[tab];

  const singleSummary = image
    ? [
        ["File Name", image.name],
        ["Current Size", bytesToText(image.size)],
        ["Resolution", `${image.w} × ${image.h}`],
      ]
    : [
        ["File Name", "No file selected"],
        ["Current Size", "-"],
        ["Resolution", "Upload an image to begin"],
      ];

  const stepPanel = useMemo(
    () => (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
          <section className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card md:p-6">
            <StepBar current={step} onGoStep={(targetStep) => setStep(targetStep)} />
            {step === 0 && <UploadStep onUpload={(img) => { setImage(img); setStep(1); }} />}
            {step === 1 && image && <ResizeStep image={image} onNext={(s) => { setSettings(s); setStep(2); }} onBack={() => setStep(0)} />}
            {step === 2 && image && settings && (
              <Suspense fallback={<LoadingFallback />}>
                <CropStep image={image} onNext={(c) => { setCropData(c); setStep(3); }} onBack={() => setStep(1)} />
              </Suspense>
            )}
            {step === 3 && image && settings && <OutputStep image={image} settings={settings} crop={cropData} onBack={() => setStep(2)} onReset={reset} onNotice={setNotice} />}
          </section>

          <aside className="space-y-6">
            <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Live Preview</p>
                  <h2
                    className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-headline text-xl font-bold text-on-surface"
                    title={image ? image.name : "Upload an image"}
                  >
                    {image ? image.name : "Upload an image"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("bulk")}
                  className="shrink-0 rounded-full bg-surface-container-high px-4 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
                >
                  Switch to Bulk
                </button>
              </div>

              {image ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl bg-surface-container">
                    <img src={image.url} alt="Uploaded preview" className="h-56 w-full object-contain p-3" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {singleSummary.map(([label, value]) => (
                      <div key={label} className="min-w-0 overflow-hidden rounded-2xl bg-surface-container-low p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
                        <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-on-surface" title={String(value)}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-surface-container-low p-6 text-center">
                  <div className="mb-3 text-4xl">🖼️</div>
                  <p className="mx-auto max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-on-surface" title="Drop an image to start">Drop an image to start</p>
                  <p className="mx-auto mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-on-surface-variant" title="The editor, cropper, and exporter activate after upload.">The editor, cropper, and exporter activate after upload.</p>
                </div>
              )}
            </div>

            <div className="rounded-[1.5rem] bg-surface-container-low p-5 shadow-card">
              <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Quick Actions</p>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-2xl bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
                >
                  Reset Session
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    ),
    [step, image, settings, cropData, reset, singleSummary]
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-surface text-on-surface font-body">
        <header className="fixed top-0 z-50 w-full bg-surface/85 shadow-nav backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-4 md:gap-8">
              <span className="font-headline text-2xl font-black tracking-tight text-primary">ImageResizerPro</span>
              <nav className="hidden items-center gap-6 md:flex">
                {TABS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`font-headline font-semibold tracking-tight transition-colors ${tab === item.id ? "border-b-2 border-primary pb-1 text-primary" : "text-on-surface-variant hover:text-primary"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                className="rounded-full border border-outline-variant/40 bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
              <span className="rounded-full border border-outline-variant/30 px-5 py-2.5 text-sm font-bold text-primary">Free & Local</span>
            </div>
          </div>

          <div className="border-b border-outline-variant/10 bg-surface-container-lowest/70 px-4 md:hidden">
            <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto py-2">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tab === item.id ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 md:px-8 md:pt-32">
          {notice && (
            <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${notice.type === "error" ? "border-error/40 bg-error/10 text-error" : "border-primary/30 bg-primary/10 text-on-surface"}`}>
              {notice.message}
            </div>
          )}

          <section className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-background md:text-6xl">{heroMeta.title}</h1>
              <p className="mt-4 max-w-2xl text-base text-on-surface-variant md:text-lg">{heroMeta.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-secondary-container px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-secondary-container">{heroMeta.badge}</span>
              <span className="rounded-full bg-surface-container-high px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Responsive</span>
              <span className="rounded-full bg-surface-container-high px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Local Processing</span>
            </div>
          </section>

          {tab === "single" && stepPanel}

          {tab === "bulk" && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <section className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card md:p-6">
                <Suspense fallback={<LoadingFallback />}>
                  <BulkTab onNotice={setNotice} />
                </Suspense>
              </section>
              <aside className="space-y-6">
                <div className="rounded-[1.5rem] bg-surface-container-low p-5 shadow-card">
                  <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Workflow Notes</p>
                  <ul className="mt-4 space-y-3 text-sm text-on-surface-variant">
                    <li>• Drag multiple files into the batch panel.</li>
                    <li>• Use one export format and quality profile for the whole queue.</li>
                    <li>• Download all processed images as a single ZIP file.</li>
                  </ul>
                </div>
                <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card">
                  <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Supported Formats</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {Object.keys(FORMAT_MIME).map((fmt) => (
                      <div key={fmt} className="rounded-2xl bg-surface-container-low p-4 font-semibold text-on-surface">{fmt}</div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </main>

        <footer className="border-t border-outline-variant/10 bg-surface-container-lowest px-4 py-5 text-center text-xs text-on-surface-variant md:px-8">
          All images are processed locally in your browser. No upload is required.
        </footer>
      </div>
    </ErrorBoundary>
  );
}

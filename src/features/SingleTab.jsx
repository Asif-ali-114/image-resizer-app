import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import StepBar from "../components/StepBar.jsx";
import UploadStep from "../steps/UploadStep.jsx";
import ResizeStep from "../steps/ResizeStep.jsx";
import OutputStep from "../steps/OutputStep.jsx";
import { bytesToText } from "../utils/imageUtils.js";

const CropStep = lazy(() => import("../steps/CropStep.jsx"));

function LoadingFallback() {
  return <div className="p-8 text-center text-on-surface-variant">Loading…</div>;
}

function SingleTab({ onNotice, onOpenTool }) {
  const [step, setStep] = useState(0);
  const [image, setImage] = useState(null);
  const [settings, setSettings] = useState(null);
  const [cropData, setCropData] = useState(null);

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

  const singleSummary = useMemo(
    () =>
      image
        ? [
            ["File Name", image.name],
            ["Current Size", bytesToText(image.size)],
            ["Resolution", `${image.w} × ${image.h}`],
          ]
        : [
            ["File Name", "No file selected"],
            ["Current Size", "-"],
            ["Resolution", "Upload an image to begin"],
          ],
    [image]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
      <section className="rounded-[1.5rem] bg-surface-container-lowest p-[var(--card-padding)] shadow-card">
        <StepBar current={step} onGoStep={(targetStep) => setStep(targetStep)} />
        {step === 0 && <UploadStep onUpload={(img) => { setImage(img); setStep(1); }} />}
        {step === 1 && image && <ResizeStep image={image} onNext={(s) => { setSettings(s); setStep(2); }} onBack={() => setStep(0)} />}
        {step === 2 && image && settings && (
          <Suspense fallback={<LoadingFallback />}>
            <CropStep image={image} onNext={(c) => { setCropData(c); setStep(3); }} onBack={() => setStep(1)} />
          </Suspense>
        )}
        {step === 3 && image && settings && (
          <OutputStep image={image} settings={settings} crop={cropData} onBack={() => setStep(2)} onReset={reset} onNotice={onNotice} />
        )}
      </section>

      <aside className="space-y-6">
        <div className="rounded-[1.5rem] bg-surface-container-lowest p-[var(--card-padding)] shadow-card">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Live Preview</p>
              <h2 className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-headline text-xl font-bold text-on-surface" title={image ? image.name : "Upload an image"}>
                {image ? image.name : "Upload an image"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onOpenTool("bulk")}
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
              <p className="mx-auto max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-on-surface">Drop an image to start</p>
            </div>
          )}
        </div>

        <div className="rounded-[1.5rem] bg-surface-container-low p-[var(--card-padding)] shadow-card">
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Quick Actions</p>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={reset}
              className="min-h-11 rounded-2xl bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
            >
              Reset Session
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default SingleTab;

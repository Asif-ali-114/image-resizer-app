export default function StepBar({ current, onGoStep }) {
  const steps = ["Upload", "Resize", "Crop", "Output"];
  return (
    <div className="flex items-center gap-2 md:gap-3 mb-8 md:mb-12 px-2 md:px-0 overflow-x-auto pb-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-shrink-0">
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (i < current) onGoStep(i);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                i < current
                  ? "bg-primary text-on-primary cursor-pointer hover:bg-primary-dim"
                  : i === current
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
              aria-label={`Step ${i + 1} ${s}`}
            >
              {i < current ? "✓" : i + 1}
            </button>
            <span className={`text-xs font-medium whitespace-nowrap ${i === current ? "text-primary font-bold" : "text-on-surface-variant"}`}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-1 mx-1 md:mx-2 transition-colors duration-300 flex-grow ${
                i < current ? "bg-primary" : "bg-surface-container"
              }`}
              style={{ minWidth: "12px", maxWidth: "60px" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

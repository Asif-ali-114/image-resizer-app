import ComparisonSlider from "./ComparisonSlider.jsx";
import DragHandle from "./DragHandle.jsx";
import FormatBadge from "./FormatBadge.jsx";
import DownloadButton from "./DownloadButton.jsx";
import { OUTPUT_FORMATS, formatLabel, getFormatMeta, needsBackgroundFill } from "../utils/convertUtils.js";
import { bytesToText } from "../utils/imageUtils.js";

function StatusIcon({ status }) {
  if (status === "converting") {
    return <span className="convert-spin inline-block h-4 w-4 rounded-full border-2 border-primary border-t-transparent" aria-label="Converting" />;
  }

  if (status === "done") {
    return (
      <span className="convert-pop inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500" aria-label="Done">
        ✓
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-error/10 text-error" aria-label="Error">
        ×
      </span>
    );
  }

  return <span className="text-on-surface-variant" aria-label="Pending">◷</span>;
}

function sizeDiffText(originalSize, convertedSize) {
  if (!convertedSize || !originalSize) return null;
  const diff = ((convertedSize - originalSize) / originalSize) * 100;
  if (Math.abs(diff) <= 2) {
    return { text: "≈ same size", cls: "bg-surface-container text-on-surface-variant" };
  }

  if (diff < 0) {
    return { text: `↓ ${Math.abs(diff).toFixed(0)}% smaller`, cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" };
  }

  return { text: `↑ ${Math.abs(diff).toFixed(0)}% larger`, cls: "bg-amber-500/15 text-amber-600 dark:text-amber-300" };
}

export default function ConvertFileRow({
  item,
  quality,
  background,
  supportedFormats = [],
  onChangeFormat,
  onRemove,
}) {
  const diff = sizeDiffText(item.size, item.result?.convertedSize);

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <DragHandle ariaLabel={`Drag ${item.name}`} />
        <img src={item.thumbnail} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusIcon status={item.status} />
            <p className="max-w-[240px] truncate text-sm font-semibold text-on-surface" title={item.name}>{item.name}</p>
            <FormatBadge format={item.srcFormat} />
            <span className="text-on-surface-variant">→</span>
            <label className="inline-flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="sr-only">Output format for {item.name}</span>
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: getFormatMeta(item.outputFormat)?.color || "#6B7280" }} />
              <select
                value={item.outputFormat}
                onChange={(e) => onChangeFormat(item.id, e.target.value)}
                className="rounded-md border border-outline-variant/40 bg-surface-container-lowest px-2 py-1 text-xs text-on-surface"
                aria-label={`Output format for ${item.name}`}
              >
                {OUTPUT_FORMATS.map((fmt) => {
                  const meta = getFormatMeta(fmt);
                  const supported = supportedFormats.includes(fmt);
                  return (
                    <option key={fmt} value={fmt} disabled={!supported} title={supported ? undefined : "Not supported in this browser"}>
                      {`${meta?.label || fmt} (.${meta?.ext || fmt})`}
                    </option>
                  );
                })}
              </select>
            </label>
            <span className={`text-xs text-on-surface-variant ${item.status === "done" ? "inline" : "hidden sm:inline"}`}>
              {bytesToText(item.size)}
            </span>
            {needsBackgroundFill(item.srcFormat, item.outputFormat) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-1 text-[11px] text-on-surface-variant">
                <span className="inline-block h-3 w-3 rounded-sm border border-outline-variant/40" style={{ background }} />
                bg fill
              </span>
            )}
          </div>

          {item.warning && <p className="mt-1 text-xs text-warn">{item.warning}</p>}
          {item.error && <p className="mt-1 text-xs text-error">{item.error}</p>}

          {item.status === "done" && item.result && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-on-surface-variant">{bytesToText(item.size)} → {bytesToText(item.result.convertedSize)}</span>
              {diff && <span className={`convert-fade inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${diff.cls}`}>{diff.text}</span>}
              <DownloadButton
                blob={item.result.blob}
                filename={`${item.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}_converted.${getFormatMeta(item.outputFormat)?.ext || item.outputFormat}`}
                label={`Download ${String(item.outputFormat).toUpperCase()}`}
                variant="secondary"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="rounded-full p-1 text-error transition-colors hover:bg-error/10"
          aria-label={`Remove ${item.name}`}
        >
          ×
        </button>
      </div>

      {item.status === "converting" && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
      )}

      {item.status === "done" && item.result?.outputUrl && (
        <div className="mt-3">
          <ComparisonSlider
            before={item.thumbnail}
            after={item.result.outputUrl}
            beforeLabel="Before"
            afterLabel="Converted"
            beforeInfo={bytesToText(item.size)}
            afterInfo={bytesToText(item.result.convertedSize)}
            width="100%"
            height={220}
          />
        </div>
      )}

      <p className="mt-2 text-xs text-on-surface-variant sm:hidden">
        {item.status === "done" && item.result
          ? `${bytesToText(item.size)} → ${bytesToText(item.result.convertedSize)}`
          : "Size hidden on mobile during queueing"}
      </p>

      {item.status === "converting" && (
        <p className="mt-1 text-xs text-on-surface-variant">
          Converting to {formatLabel(item.outputFormat)} at quality {quality}
        </p>
      )}
    </div>
  );
}

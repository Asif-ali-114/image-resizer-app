import { INPUT_FORMATS, OUTPUT_FORMATS, canConvert, formatLabel, isLossyFormat, needsBackgroundFill } from "../utils/convertUtils.js";

function cellMarker(input, output) {
  if (!canConvert(input, output)) return { mark: "✗", cls: "text-on-surface-variant" };
  if (isLossyFormat(output)) return { mark: "~", cls: "text-amber-500" };
  return { mark: "✓", cls: "text-emerald-500" };
}

function tooltip(input, output) {
  if (!canConvert(input, output)) return `${formatLabel(input)} → ${formatLabel(output)}: Not reliably supported.`;

  const lossyText = isLossyFormat(output) ? "Lossy output." : "Lossless or near-lossless output.";
  const alphaText = needsBackgroundFill(input, output)
    ? "Transparency will be flattened unless background fill is selected."
    : "Transparency handling is compatible.";
  return `${formatLabel(input)} → ${formatLabel(output)}: ${lossyText} ${alphaText}`;
}

export default function FormatMatrix({ show }) {
  if (!show) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
      <table className="w-full min-w-[680px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left font-bold text-on-surface-variant">Input \ Output</th>
            {OUTPUT_FORMATS.map((out) => (
              <th key={out} className="p-2 text-center font-bold text-on-surface-variant">{formatLabel(out)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {INPUT_FORMATS.map((input) => (
            <tr key={input} className="border-t border-outline-variant/20">
              <td className="p-2 font-semibold text-on-surface">{formatLabel(input)}</td>
              {OUTPUT_FORMATS.map((output) => {
                const mark = cellMarker(input, output);
                return (
                  <td
                    key={`${input}-${output}`}
                    className={`p-2 text-center text-base font-bold ${mark.cls}`}
                    title={tooltip(input, output)}
                  >
                    {mark.mark}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { formatLabel, getFormatMeta } from "../utils/convertUtils.js";

export default function FormatBadge({ format }) {
  const meta = getFormatMeta(format);
  const accentLike = ["avif", "webp", "png"].includes(String(format || "").toLowerCase());
  return (
    <span
      className={`ui-badge ${accentLike ? "ui-badge--accent" : ""}`}
      style={!accentLike && meta?.color ? { borderColor: "var(--color-base-200)", color: "var(--color-text-secondary)", background: "var(--color-base-100)" } : undefined}
      aria-label={`Format ${formatLabel(format)}`}
    >
      {formatLabel(format)}
    </span>
  );
}

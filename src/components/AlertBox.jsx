import { iconProps, ToolAlertIcon } from "./AppIcons.jsx";

/**
 * Shared alert box component for displaying error and warning messages.
 * Replaces the duplicated ErrBox and WarnBox components across multiple files.
 *
 * @param {{ msg: string, variant?: "error" | "warn" }} props
 */
export default function AlertBox({ msg, variant = "error" }) {
  if (!msg) return null;

  const isWarn = variant === "warn";
  const colorClass = isWarn ? "text-warn" : "text-error";
  const bgClass = isWarn ? "bg-warn/10" : "bg-error/10";
  const borderClass = isWarn ? "border-warn/30" : "border-error/30";

  return (
    <div className={`mt-4 p-4 ${bgClass} border ${borderClass} rounded-lg ${colorClass} text-sm font-medium flex items-start gap-3`}>
      <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full ${bgClass} ${colorClass}`}>
        <ToolAlertIcon {...iconProps} size={14} />
      </span>
      <span>{msg}</span>
    </div>
  );
}

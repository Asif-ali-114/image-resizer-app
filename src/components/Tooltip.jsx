export default function Tooltip({ text, className = "", position = "top" }) {
  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-2",
    bottom: "top-full left-1/2 -translate-x-1/2 translate-y-2",
    left: "right-full top-1/2 -translate-y-1/2 -translate-x-2",
    right: "left-full top-1/2 -translate-y-1/2 translate-x-2",
  };

  return (
    <span role="tooltip" className={`ui-tooltip pointer-events-none absolute z-50 whitespace-nowrap ${positions[position] || positions.top} ${className}`.trim()}>
      {text}
    </span>
  );
}

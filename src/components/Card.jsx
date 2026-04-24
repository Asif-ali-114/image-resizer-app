export default function Card({ children, className = "", style }) {
  return (
    <div
      className={`ui-card rounded-2xl border p-6 transition-[transform,box-shadow,border-color,background-color] duration-150 ${className}`}
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

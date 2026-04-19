export default function Card({ children, className = "", style }) {
  return (
    <div
      className={`rounded-xl border p-6 ${className}`}
      style={{
        background: "var(--color-base-0)",
        borderColor: "var(--color-base-200)",
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

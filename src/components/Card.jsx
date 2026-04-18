export default function Card({ children, className = "", style }) {
  return (
    <div className={`bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6 ${className}`} style={style}>
      {children}
    </div>
  );
}

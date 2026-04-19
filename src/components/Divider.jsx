export default function Divider({ subtle = false, strong = false, className = "", vertical = false }) {
  if (vertical) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          display: "inline-block",
          width: "1px",
          alignSelf: "stretch",
          background: strong ? "var(--color-base-300)" : subtle ? "var(--color-base-100)" : "var(--color-base-200)",
          margin: "0 8px",
        }}
      />
    );
  }

  return <hr className={`ui-divider ${subtle ? "ui-divider--subtle" : ""} ${strong ? "ui-divider--strong" : ""} ${className}`.trim()} />;
}

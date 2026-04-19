export default function ToolView({ activeToolLabel, onBackHome, children }) {
  return (
    <section className="content-area mx-auto w-full max-w-[1280px] px-[var(--page-padding)] pb-10 pt-4">
      <div className="mb-4 flex h-11 items-center border-b border-outline-variant/20 text-sm text-on-surface-variant md:hidden">
        <button type="button" onClick={onBackHome} className="text-on-surface">← Back</button>
        <span className="ml-3 font-semibold text-on-surface">{activeToolLabel}</span>
      </div>
      <div className="animate-[fadeSlideIn_0.2s_ease-out]">{children}</div>
    </section>
  );
}

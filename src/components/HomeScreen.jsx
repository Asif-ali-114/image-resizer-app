import Card from "./Card.jsx";

function ToolCard({ item, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className="text-left"
    >
      <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50">
        <div className="text-3xl" style={{ color: item.color }} aria-hidden="true">{item.icon}</div>
        <h3 className="mt-4 text-[15px] font-semibold text-on-surface">{item.label}</h3>
        <p className="mt-2 text-sm text-on-surface-variant max-[399px]:line-clamp-1">{item.description}</p>
      </Card>
    </button>
  );
}

export default function HomeScreen({ tools, onOpenTool }) {
  return (
    <section className="content-area mx-auto w-full max-w-[1280px] px-[var(--page-padding)] pb-10 pt-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-on-surface md:text-4xl">Professional Image Tools</h1>
        <p className="mt-2 text-sm text-on-surface-variant md:text-base">Everything you need for images — free, private, browser-based</p>
      </div>

      <div className="grid gap-[var(--section-gap)] sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((item) => (
          <ToolCard key={item.id} item={item} onOpen={onOpenTool} />
        ))}
      </div>

      <p className="pt-8 text-center text-sm text-on-surface-variant">Press Ctrl+K to search tools · All processing is local · Your images never leave your device</p>
    </section>
  );
}

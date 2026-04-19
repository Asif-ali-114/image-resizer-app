export default function ToolLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-14 rounded-xl bg-surface-container-low" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-xl bg-surface-container-low" />
        <div className="h-28 rounded-xl bg-surface-container-low" />
        <div className="h-28 rounded-xl bg-surface-container-low" />
      </div>
    </div>
  );
}

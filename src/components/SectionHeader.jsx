export default function SectionHeader({ children, icon }) {
  return (
    <h3 className="text-lg font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
      {icon && <span className="text-xl">{icon}</span>}
      {children}
    </h3>
  );
}

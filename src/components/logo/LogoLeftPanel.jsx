import TemplatesPanel from "./panels/TemplatesPanel.jsx";
import ElementsPanel from "./panels/ElementsPanel.jsx";
import TextPanel from "./panels/TextPanel.jsx";
import ImagesPanel from "./panels/ImagesPanel.jsx";
import BackgroundPanel from "./panels/BackgroundPanel.jsx";
import LayersPanel from "./panels/LayersPanel.jsx";

const TABS = [
  {
    id: "templates",
    label: "Templates",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 5h16v14H4z" />
        <path d="M4 10h16" />
      </svg>
    ),
  },
  {
    id: "elements",
    label: "Elements",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="7" cy="7" r="3" />
        <rect x="12" y="4" width="8" height="6" rx="1" />
        <path d="M4 18h16" />
      </svg>
    ),
  },
  {
    id: "text",
    label: "Text",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6h16" />
        <path d="M12 6v12" />
      </svg>
    ),
  },
  {
    id: "images",
    label: "Images",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 14l3-3 3 3 4-4" />
      </svg>
    ),
  },
  {
    id: "background",
    label: "Background",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 4h16v16H4z" />
        <path d="M4 12h16" />
      </svg>
    ),
  },
  {
    id: "layers",
    label: "Layers",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4l8 4-8 4-8-4 8-4z" />
        <path d="M4 12l8 4 8-4" />
        <path d="M4 16l8 4 8-4" />
      </svg>
    ),
  },
];

export default function LogoLeftPanel({ activeTab, onTabChange, panelProps, compact = false, collapsed = false, onToggleCollapse }) {
  return (
    <aside
      className={`left-panel logo-panel-enter relative flex h-full overflow-hidden border-r ${collapsed ? "w-[72px]" : compact ? "w-[260px]" : "w-[320px]"}`}
      style={{ borderColor: "var(--color-base-200)", backgroundColor: "var(--color-base-100)" }}
    >
      <nav className="ui-sidebar flex w-[72px] flex-col gap-1 border-r p-2" style={{ borderColor: "var(--color-base-200)", backgroundColor: "var(--color-base-100)" }}>
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapse}
          className="logo-press mb-2 inline-flex h-9 w-full items-center justify-center rounded-lg border text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          style={{ borderColor: "var(--color-base-200)", backgroundColor: "var(--color-base-0)" }}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            title={tab.label}
            aria-label={tab.label}
            onClick={() => onTabChange(tab.id)}
            className={`logo-press group relative inline-flex h-11 w-full items-center justify-center rounded-lg border ${activeTab === tab.id ? "text-[var(--color-accent-primary)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"}`}
            style={{
              borderColor: activeTab === tab.id ? "var(--color-accent-border)" : "transparent",
              backgroundColor: activeTab === tab.id ? "var(--color-accent-light)" : "transparent",
            }}
          >
            {tab.icon}
            <span className="ui-tooltip pointer-events-none absolute left-[56px] hidden group-hover:block">{tab.label}</span>
          </button>
        ))}
      </nav>

      {!collapsed && (
          <div className="sidebar-content panel-content logo-panel-enter flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{TABS.find((item) => item.id === activeTab)?.label}</h3>
            <span className="ui-badge">Panel</span>
          </div>
          {activeTab === "templates" && <TemplatesPanel {...panelProps} />}
          {activeTab === "elements" && <ElementsPanel {...panelProps} />}
          {activeTab === "text" && <TextPanel {...panelProps} />}
          {activeTab === "images" && <ImagesPanel {...panelProps} />}
          {activeTab === "background" && <BackgroundPanel {...panelProps} />}
          {activeTab === "layers" && <LayersPanel {...panelProps} />}
        </div>
      )}
    </aside>
  );
}

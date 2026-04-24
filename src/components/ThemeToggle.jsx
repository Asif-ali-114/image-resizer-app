import { useTheme } from "../context/ThemeContext.jsx";
import { iconProps, ToolMoonIcon, ToolSunIcon } from "./AppIcons.jsx";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        height: "40px",
        padding: "8px 14px",
        borderRadius: "12px",
        border: "1px solid var(--border-default)",
        background: "var(--bg-card)",
        color: "var(--text-secondary)",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 150ms ease",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-hover)";
        e.currentTarget.style.color = "var(--text-primary)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-card)";
        e.currentTarget.style.color = "var(--text-secondary)";
        e.currentTarget.style.borderColor = "var(--border-default)";
      }}
    >
      {isDark ? <ToolSunIcon {...iconProps} /> : <ToolMoonIcon {...iconProps} />}
      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}

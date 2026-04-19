import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import TopBar from "./components/TopBar.jsx";
import HomeScreen from "./components/HomeScreen.jsx";
import ToolView from "./components/ToolView.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import KeyboardShortcutsModal from "./components/KeyboardShortcutsModal.jsx";
import ToolLoadingSkeleton from "./components/ToolLoadingSkeleton.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import FeatureErrorBoundary from "./components/FeatureErrorBoundary.jsx";
import FeedbackWidget from "./components/FeedbackWidget.jsx";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts.js";
import useCommandPalette from "./hooks/useCommandPalette.js";
import { useScrollLock } from "./hooks/useScrollLock.js";
import useToast from "./hooks/useToast.js";
import useRecentTools from "./hooks/useRecentTools.js";
import { useTheme } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { CommandPaletteProvider } from "./context/CommandPaletteContext.jsx";
import { loadFromSession, saveToSession } from "./utils/sessionStore.js";

const SingleTab = lazy(() => import("./features/SingleTab.jsx"));
const BulkTab = lazy(() => import("./features/BulkTab.jsx"));
const ConvertTab = lazy(() => import("./features/ConvertTab.jsx"));
const CompressTab = lazy(() => import("./features/CompressTab.jsx"));
const EditorTab = lazy(() => import("./features/EditorTab.jsx"));
const PdfTab = lazy(() => import("./features/PdfTab.jsx"));
const SpriteTab = lazy(() => import("./features/SpriteTab.jsx"));
const PaletteTab = lazy(() => import("./features/PaletteTab.jsx"));
const LogoCreatorTab = lazy(() => import("./features/LogoCreator/index.jsx"));

const ICON_COLORS = {
  single: "rgb(var(--color-primary))",
  bulk: "#F97316",
  convert: "#22C55E",
  compress: "#22C55E",
  editor: "#A855F7",
  pdf: "#EF4444",
  sprite: "#F59E0B",
  palette: "#EC4899",
  logo: "#0EA5E9",
  url: "#14B8A6",
  action: "rgb(var(--color-on-surface-variant))",
};

const TOOL_META = [
  { id: "single", label: "Single Resize", description: "Resize and crop one image at a time", icon: "🖼", aliases: ["resize", "photo"], color: ICON_COLORS.single },
  { id: "bulk", label: "Bulk Resize", description: "Process hundreds of images at once", icon: "📦", aliases: ["resize", "batch", "photo"], color: ICON_COLORS.bulk },
  { id: "convert", label: "Image Converter", description: "Convert between JPEG PNG WebP and more", icon: "↻", aliases: ["convert", "compress", "export"], color: ICON_COLORS.convert },
  { id: "compress", label: "Image Compressor", description: "Reduce file size while preserving quality", icon: "🗜", aliases: ["compress", "convert", "photo"], color: ICON_COLORS.convert },
  { id: "editor", label: "Image Editor", description: "Brightness, contrast, filters and transforms", icon: "▤", aliases: ["resize", "compress", "photo"], color: ICON_COLORS.editor },
  { id: "pdf", label: "Image to PDF", description: "Combine images into one PDF document", icon: "📄", aliases: ["pdf", "export"], color: ICON_COLORS.pdf },
  { id: "sprite", label: "Sprite Sheet", description: "Pack icons into one sprite sheet", icon: "⊞", aliases: ["sprite", "export"], color: ICON_COLORS.sprite },
  { id: "palette", label: "Color Palette", description: "Extract dominant colors from any image", icon: "🎨", aliases: ["palette", "export", "photo"], color: ICON_COLORS.palette },
  { id: "logo", label: "Logo Creator", description: "Create logos, banners and social graphics", icon: "✦", aliases: ["logo", "design", "canvas", "brand", "poster", "thumbnail"], color: ICON_COLORS.logo },
];

const ACTION_META = [
  { id: "toggle-theme", label: "Toggle Dark Mode", description: "Switch between light and dark", icon: "🌙", aliases: ["theme", "dark", "light"], color: ICON_COLORS.action, kind: "action" },
  { id: "open-shortcuts", label: "Keyboard Shortcuts", description: "View all keyboard shortcuts", icon: "⌨", aliases: ["shortcuts", "keys"], color: ICON_COLORS.action, kind: "action" },
];

function AppContent() {
  const [activeTool, setActiveTool] = useState(() => loadFromSession("lastActiveTab", "single"));
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const logoCanvasJsonRef = useRef(null);
  const { toggleTheme } = useTheme();
  useScrollLock();

  const { isOpen, openPalette, closePalette } = useCommandPalette();
  const { toasts, showToast, removeToast } = useToast();
  const { recentTools, pushRecentTool } = useRecentTools();

  const activeToolMeta = useMemo(() => TOOL_META.find((item) => item.id === activeTool) || null, [activeTool]);

  useEffect(() => {
    if (activeTool) {
      saveToSession("lastActiveTab", activeTool);
    }
  }, [activeTool]);

  const openTool = useCallback((toolId) => {
    setActiveTool(toolId);
    pushRecentTool(toolId);
  }, [pushRecentTool]);

  const onNotice = useCallback((payload) => {
    if (!payload) return;
    showToast({
      type: payload.type || "info",
      message: payload.message || "Action completed.",
      action: payload.action || (payload.actionLabel && payload.onAction ? { label: payload.actionLabel, onClick: payload.onAction } : null),
    });
  }, [showToast]);

  const goHome = useCallback(() => setActiveTool(null), []);

  const runAction = useCallback((actionId) => {
    if (actionId === "toggle-theme") toggleTheme();
    if (actionId === "open-shortcuts") setShortcutsOpen(true);
  }, [toggleTheme]);

  const dispatchToolShortcut = useCallback((action) => {
    if (!activeTool) return;
    window.dispatchEvent(new window.CustomEvent("imagetools:shortcut", { detail: { tool: activeTool, action } }));
  }, [activeTool]);

  useKeyboardShortcuts(
    {
      "ctrl+k": () => {
        openPalette();
      },
      "ctrl+/": () => {
        setShortcutsOpen(true);
      },
      "ctrl+shift+l": () => {
        toggleTheme();
      },
      "ctrl+v": () => false,
      esc: () => {
        if (isOpen) {
          closePalette();
          return;
        }
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          return;
        }
        if (activeTool) {
          goHome();
        }
      },
      "ctrl+z": () => { if (activeTool === "editor") dispatchToolShortcut("editor-undo"); },
      "ctrl+y": () => { if (activeTool === "editor") dispatchToolShortcut("editor-redo"); },
      "ctrl+s": () => { if (activeTool === "editor") dispatchToolShortcut("editor-export"); },
      enter: () => {
        if (activeTool === "bulk") dispatchToolShortcut("bulk-process-start");
        if (activeTool === "convert") dispatchToolShortcut("convert-start");
        if (activeTool === "compress") dispatchToolShortcut("compress-start");
        if (activeTool === "pdf") dispatchToolShortcut("pdf-generate");
        if (activeTool === "sprite") dispatchToolShortcut("sprite-generate");
        if (activeTool === "palette") dispatchToolShortcut("palette-extract");
      },
      "ctrl+shift+x": () => {
        if (activeTool === "bulk") dispatchToolShortcut("bulk-clear");
        if (activeTool === "convert") dispatchToolShortcut("convert-clear");
      },
      "ctrl+enter": () => { if (activeTool === "palette") dispatchToolShortcut("palette-extract"); },
      "ctrl+shift+c": () => { if (activeTool === "palette") dispatchToolShortcut("palette-export-css"); },
    },
    { enabled: true }
  );

  const toolPanels = useMemo(() => [
    { id: "single", node: <SingleTab onNotice={onNotice} onOpenTool={openTool} /> },
    { id: "bulk", node: <BulkTab onNotice={onNotice} isActive={activeTool === "bulk"} /> },
    { id: "convert", node: <ConvertTab onNotice={onNotice} isActive={activeTool === "convert"} /> },
    { id: "compress", node: <CompressTab onNotice={onNotice} isActive={activeTool === "compress"} /> },
    { id: "editor", node: <EditorTab onNotice={onNotice} isActive={activeTool === "editor"} /> },
    { id: "pdf", node: <PdfTab onNotice={onNotice} isActive={activeTool === "pdf"} /> },
    { id: "sprite", node: <SpriteTab onNotice={onNotice} isActive={activeTool === "sprite"} /> },
    { id: "palette", node: <PaletteTab onNotice={onNotice} isActive={activeTool === "palette"} /> },
  ], [activeTool, onNotice, openTool]);

  const logoPanel = (
    <LogoCreatorTab
      onNotice={onNotice}
      isActive={activeTool === "logo"}
      onBackHome={goHome}
      persistedCanvasJsonRef={logoCanvasJsonRef}
    />
  );

  return (
    <div
      className={`app-container app-shell bg-surface text-on-surface font-body ${activeTool ? "has-subnav" : ""}`}
    >
      <TopBar
        activeTool={activeTool}
        activeToolLabel={activeToolMeta?.label || ""}
        onBackHome={goHome}
        onOpenPalette={openPalette}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      <div className="app-body">
        {activeTool !== "logo" && (
          <main className="app-main flex-1 min-h-0 min-w-0 overflow-hidden">
            <div className="canvas-scroll-area flex h-full min-h-0 min-w-0 flex-1 flex-col">
              {!activeTool && <HomeScreen tools={TOOL_META} onOpenTool={openTool} />}

              {activeTool && (
                <ToolView activeToolLabel={activeToolMeta?.label} onBackHome={goHome}>
                  {toolPanels.map((panel) => (
                    <div key={panel.id} style={{ display: activeTool === panel.id ? "block" : "none" }} aria-hidden={activeTool !== panel.id}>
                      <Suspense fallback={<ToolLoadingSkeleton />}>
                        <FeatureErrorBoundary>{panel.node}</FeatureErrorBoundary>
                      </Suspense>
                    </div>
                  ))}
                </ToolView>
              )}
            </div>
          </main>
        )}
      </div>

      {activeTool === "logo" ? (
        <Suspense fallback={<ToolLoadingSkeleton />}>
          <FeatureErrorBoundary>{logoPanel}</FeatureErrorBoundary>
        </Suspense>
      ) : null}

      <CommandPalette
        open={isOpen}
        tools={TOOL_META}
        actions={ACTION_META}
        recentTools={recentTools}
        onClose={closePalette}
        onOpenTool={openTool}
        onRunAction={runAction}
      />

      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <FeedbackWidget onNotice={onNotice} />
    </div>
  );
}

const MemoAppContent = memo(AppContent);

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <CommandPaletteProvider>
          <MemoAppContent />
        </CommandPaletteProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

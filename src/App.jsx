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
import { loadFromLocal, loadFromSession, saveToLocal, saveToSession } from "./utils/sessionStore.js";
import {
  ToolBoxesIcon,
  ToolFileTextIcon,
  ToolImageIcon,
  ToolKeyboardIcon,
  ToolLayoutGridIcon,
  ToolMoonIcon,
  ToolPaletteIcon,
  ToolRefreshIcon,
  ToolSparklesIcon,
} from "./components/AppIcons.jsx";

const SingleTab = lazy(() => import("./features/SingleTab.jsx"));
const BulkTab = lazy(() => import("./features/BulkTab.jsx"));
const ConvertTab = lazy(() => import("./features/ConvertTab.jsx"));
const CompressTab = lazy(() => import("./features/CompressTab.jsx"));
const EditorTab = lazy(() => import("./features/EditorTab.jsx"));
const PdfTab = lazy(() => import("./features/PdfTab.jsx"));
const SpriteTab = lazy(() => import("./features/SpriteTab.jsx"));
const PaletteTab = lazy(() => import("./features/PaletteTab.jsx"));
const LogoCreatorTab = lazy(() => import("./features/LogoCreator/index.jsx"));

const TOOL_META = [
  { id: "single", label: "Single Resize", description: "Resize and crop one image at a time", icon: ToolImageIcon, aliases: ["resize", "photo"] },
  { id: "bulk", label: "Bulk Resize", description: "Process hundreds of images at once", icon: ToolBoxesIcon, aliases: ["resize", "batch", "photo"] },
  { id: "convert", label: "Image Converter", description: "Convert between JPEG PNG WebP and more", icon: ToolRefreshIcon, aliases: ["convert", "compress", "export"] },
  { id: "compress", label: "Image Compressor", description: "Reduce file size while preserving quality", icon: ToolSparklesIcon, aliases: ["compress", "convert", "photo"] },
  { id: "editor", label: "Image Editor", description: "Brightness, contrast, filters and transforms", icon: ToolLayoutGridIcon, aliases: ["resize", "compress", "photo"] },
  { id: "pdf", label: "Image to PDF", description: "Combine images into one PDF document", icon: ToolFileTextIcon, aliases: ["pdf", "export"] },
  { id: "sprite", label: "Sprite Sheet", description: "Pack icons into one sprite sheet", icon: ToolLayoutGridIcon, aliases: ["sprite", "export"] },
  { id: "palette", label: "Color Palette", description: "Extract dominant colors from any image", icon: ToolPaletteIcon, aliases: ["palette", "export", "photo"] },
  { id: "logo", label: "Logo Creator", description: "Create logos, banners and social graphics", icon: ToolSparklesIcon, aliases: ["logo", "design", "canvas", "brand", "poster", "thumbnail"] },
];

const ACTION_META = [
  { id: "toggle-theme", label: "Toggle Dark Mode", description: "Switch between light and dark", icon: ToolMoonIcon, aliases: ["theme", "dark", "light"], kind: "action" },
  { id: "open-shortcuts", label: "Keyboard Shortcuts", description: "View all keyboard shortcuts", icon: ToolKeyboardIcon, aliases: ["shortcuts", "keys"], kind: "action" },
];

const UI_MODES = ["classic", "neo", "nova"];

function getInitialUiMode() {
  const saved = loadFromLocal("ui.mode", "classic");
  return UI_MODES.includes(saved) ? saved : "classic";
}

function AppContent() {
  const [activeTool, setActiveTool] = useState(() => loadFromSession("lastActiveTab", "single"));
  const [uiMode, setUiMode] = useState(() => getInitialUiMode());
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [singlePrefill, setSinglePrefill] = useState(null);
  const [bulkPrefill, setBulkPrefill] = useState(null);
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

  useEffect(() => {
    saveToLocal("ui.mode", uiMode);
    const root = document.documentElement;
    root.setAttribute("data-ui-mode", uiMode);
  }, [uiMode]);

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

  const toggleUiMode = useCallback(() => {
    setUiMode((current) => {
      const currentIndex = UI_MODES.indexOf(current);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % UI_MODES.length : 0;
      return UI_MODES[nextIndex];
    });
  }, []);

  const setUiModeSafe = useCallback((nextMode) => {
    setUiMode(UI_MODES.includes(nextMode) ? nextMode : "classic");
  }, []);

  const handleFileDrop = useCallback((files, suggestedTool) => {
    const imageFiles = Array.from(files || []).filter((file) => file.type?.startsWith("image/"));
    if (!imageFiles.length) {
      onNotice?.({ type: "error", message: "Please drop image files only." });
      return;
    }

    if (suggestedTool === "single") {
      const first = imageFiles[0];
      setSinglePrefill({ id: `single-drop-${Date.now()}`, file: first });
      setActiveTool("single");
      pushRecentTool("single");
      return;
    }

    setBulkPrefill({ id: `bulk-drop-${Date.now()}`, files: imageFiles });
    setActiveTool("bulk");
    pushRecentTool("bulk");
  }, [onNotice, pushRecentTool]);

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
    { id: "single", node: <SingleTab onNotice={onNotice} onOpenTool={openTool} prefillFile={singlePrefill} /> },
    { id: "bulk", node: <BulkTab onNotice={onNotice} isActive={activeTool === "bulk"} prefillFiles={bulkPrefill} /> },
    { id: "convert", node: <ConvertTab onNotice={onNotice} isActive={activeTool === "convert"} /> },
    { id: "compress", node: <CompressTab onNotice={onNotice} isActive={activeTool === "compress"} /> },
    { id: "editor", node: <EditorTab onNotice={onNotice} isActive={activeTool === "editor"} /> },
    { id: "pdf", node: <PdfTab onNotice={onNotice} isActive={activeTool === "pdf"} /> },
    { id: "sprite", node: <SpriteTab onNotice={onNotice} isActive={activeTool === "sprite"} /> },
    { id: "palette", node: <PaletteTab onNotice={onNotice} isActive={activeTool === "palette"} /> },
  ], [activeTool, bulkPrefill, onNotice, openTool, singlePrefill]);

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
      className={`app-container app-shell bg-surface text-on-surface font-body ${activeTool ? "has-subnav" : ""} ui-${uiMode}`}
    >
      <TopBar
        activeTool={activeTool}
        activeToolLabel={activeToolMeta?.label || ""}
        onBackHome={goHome}
        onOpenPalette={openPalette}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        uiMode={uiMode}
        onToggleUiMode={toggleUiMode}
        onSetUiMode={setUiModeSafe}
      />

      <div className="app-body">
        {activeTool !== "logo" && (
          <main className="app-main flex-1 min-h-0 min-w-0 overflow-hidden">
            <div className="canvas-scroll-area flex h-full min-h-0 min-w-0 flex-1 flex-col">
              {!activeTool && (
                <HomeScreen
                  tools={TOOL_META}
                  onOpenTool={openTool}
                  onFileDrop={handleFileDrop}
                  onInvalidDrop={() => onNotice?.({ type: "error", message: "Please drop image files only." })}
                  uiMode={uiMode}
                />
              )}

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

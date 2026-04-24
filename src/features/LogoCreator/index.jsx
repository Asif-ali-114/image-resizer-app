import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fabric } from "fabric";
import Btn from "../../components/Btn.jsx";
import useKeyboardShortcuts from "../../hooks/useKeyboardShortcuts.js";
import LogoToolbar from "../../components/logo/LogoToolbar.jsx";
import LogoLeftPanel from "../../components/logo/LogoLeftPanel.jsx";
import LogoRightPanel from "../../components/logo/LogoRightPanel.jsx";
import LogoCanvas from "../../components/logo/LogoCanvas.jsx";
import LogoBottomBar from "../../components/logo/LogoBottomBar.jsx";
import ExportModal from "../../components/logo/modals/ExportModal.jsx";
import CanvasSizeModal from "../../components/logo/modals/CanvasSizeModal.jsx";
import SavedDesignsModal from "../../components/logo/modals/SavedDesignsModal.jsx";
import SaveNameModal from "../../components/logo/modals/SaveNameModal.jsx";
import ConfirmActionModal from "../../components/logo/modals/ConfirmActionModal.jsx";
import CanvasHistory from "../../utils/logo/canvasHistory.js";
import { buildGoogleFontsCssUrl } from "../../utils/logo/fontList.js";
import { createShape, centerObject, getObjectLabel, sanitizeFilename } from "../../utils/logo/fabricHelpers.js";
import { exportJPEG, exportPDF, exportPNG, exportSVG } from "../../utils/logo/exportUtils.js";
import { generateId } from "../../utils/generateId.js";

const AUTOSAVE_KEY = "logocreator_autosave";
const SAVES_KEY = "logocreator_saves";

function isQuotaExceededError(error) {
  return error instanceof globalThis.DOMException && (error.name === "QuotaExceededError" || error.code === 22 || error.code === 1014);
}

function downloadCanvasAsJson(canvasJson, filename = "logo-design.json") {
  const json = JSON.stringify(canvasJson);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function useViewportMode() {
  const [mode, setMode] = useState("desktop");
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setMode("mobile");
      else if (w < 1024) setMode("tablet");
      else setMode("desktop");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return mode;
}

function readSaves() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export default function LogoCreator({ onNotice, isActive, onBackHome, persistedCanvasJsonRef }) {
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";
  const isTablet = viewportMode === "tablet";

  const [activeTab, setActiveTab] = useState("templates");
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [zoom, setZoom] = useState(1);
  const [gridVisible, setGridVisible] = useState(false);
  const [gridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [preview, setPreview] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [contextTool, setContextTool] = useState("select");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [recentColors, setRecentColors] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [objectCount, setObjectCount] = useState(0);
  const [images, setImages] = useState([]);
  const [layers, setLayers] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [canvasSizeOpen, setCanvasSizeOpen] = useState(false);
  const [savedDesignsOpen, setSavedDesignsOpen] = useState(false);
  const [saveNameOpen, setSaveNameOpen] = useState(false);
  const [saveNameDefault, setSaveNameDefault] = useState("");
  const [confirmState, setConfirmState] = useState({ open: false, title: "", message: "", confirmLabel: "Confirm" });
  const [saves, setSaves] = useState(() => readSaves());

  const canvasRef = useRef(null);
  const historyRef = useRef(null);
  const clipboardRef = useRef(null);
  const autosaveTimeoutRef = useRef(null);
  const isDirtyRef = useRef(false);
  const pendingConfirmActionRef = useRef(null);

  const refreshLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    const list = [...objects].reverse().map((obj) => {
      if (!obj.__layerId) obj.__layerId = generateId();
      return {
        id: obj.__layerId,
        object: obj,
        visible: obj.visible !== false,
        locked: !!obj.lockMovementX,
      };
    });
    setLayers(list);
    setObjectCount(objects.length);
  }, []);

  const saveAutosave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const payload = {
        canvasJSON: canvas.toJSON(),
        canvasWidth,
        canvasHeight,
        timestamp: Date.now(),
      };
      window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
      if (persistedCanvasJsonRef) persistedCanvasJsonRef.current = payload.canvasJSON;
      isDirtyRef.current = false;
    } catch (error) {
      if (isQuotaExceededError(error)) {
        const canvas = canvasRef.current;
        const canvasJson = canvas?.toJSON();
        if (canvasJson) {
          downloadCanvasAsJson(canvasJson);
        }
        onNotice?.({ type: "warning", message: "Design too large for auto-save. Your design has been saved as a file." });
      }
    }
  }, [canvasWidth, canvasHeight, onNotice, persistedCanvasJsonRef]);

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimeoutRef.current) window.clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = window.setTimeout(() => {
      saveAutosave();
    }, 2000);
  }, [saveAutosave]);

  const onCanvasModified = useCallback(() => {
    historyRef.current?.save();
    isDirtyRef.current = true;
    refreshLayers();
    scheduleAutosave();
  }, [refreshLayers, scheduleAutosave]);

  const ensureFontLoaded = useCallback(async (fontName) => {
    const id = `logo-font-${fontName.replace(/\s+/g, "-").toLowerCase()}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = buildGoogleFontsCssUrl(fontName, ["400", "500", "700", "900"]);
      document.head.appendChild(link);
    }
    try {
      await document.fonts.load(`16px "${fontName}"`);
    } catch {
      // noop
    }
  }, []);

  const onCanvasReady = useCallback((canvas) => {
    canvasRef.current = canvas;
    historyRef.current = new CanvasHistory(canvas);

    const savedJson = persistedCanvasJsonRef?.current;
    if (savedJson) {
      canvas.loadFromJSON(savedJson, () => {
        canvas.renderAll();
        refreshLayers();
      });
    }

    const maybeAutosave = window.localStorage.getItem(AUTOSAVE_KEY);
    if (maybeAutosave) {
      onNotice?.({
        type: "info",
        message: "Restore your previous Logo Creator design?",
        action: {
          label: "Restore",
          onClick: () => {
            try {
              const parsed = JSON.parse(maybeAutosave);
              setCanvasWidth(parsed.canvasWidth || 800);
              setCanvasHeight(parsed.canvasHeight || 600);
              canvas.loadFromJSON(parsed.canvasJSON, () => {
                canvas.renderAll();
                refreshLayers();
                onNotice?.({ type: "success", message: "Previous design restored." });
              });
            } catch {
              onNotice?.({ type: "error", message: "Could not restore autosave." });
            }
          },
        },
      });
    }

    historyRef.current.save();
    refreshLayers();
  }, [onNotice, persistedCanvasJsonRef, refreshLayers]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (isDirtyRef.current) saveAutosave();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [saveAutosave]);

  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) window.clearTimeout(autosaveTimeoutRef.current);
      images.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [images]);

  const applyCanvasSize = useCallback((w, h) => {
    const width = Math.max(100, Number(w) || 800);
    const height = Math.max(100, Number(h) || 600);
    setCanvasWidth(width);
    setCanvasHeight(height);
  }, []);

  const withCanvas = useCallback((fn) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    fn(canvas);
    canvas.requestRenderAll();
    refreshLayers();
    scheduleAutosave();
  }, [refreshLayers, scheduleAutosave]);

  const addShape = useCallback((type) => {
    withCanvas((canvas) => {
      let object;
      if (type === "dashed-line" || type === "dotted-line" || type === "double-line" || type === "arrow-line" || type === "curved-line" || type === "zigzag-line" || type === "wave-line") {
        object = new fabric.Line([0, 0, 280, 0], {
          stroke: "#2D3748",
          strokeWidth: type === "double-line" ? 4 : 2,
          strokeDashArray: type === "dashed-line" ? [14, 8] : type === "dotted-line" ? [2, 6] : null,
        });
      } else {
        object = createShape(type);
      }
      centerObject(canvas, object);
      canvas.add(object);
      canvas.setActiveObject(object);
      historyRef.current?.save();
    });
  }, [withCanvas]);

  const addIcon = useCallback((icon) => {
    withCanvas((canvas) => {
      const svg = `<svg viewBox="${icon.viewBox}" xmlns="http://www.w3.org/2000/svg"><path d="${icon.path}" stroke="#1f2937" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      fabric.loadSVGFromString(svg, (objects, options) => {
        const group = fabric.util.groupSVGElements(objects, options);
        group.set({ left: canvas.getWidth() / 2 - 40, top: canvas.getHeight() / 2 - 40, scaleX: 3, scaleY: 3 });
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        historyRef.current?.save();
        refreshLayers();
      });
    });
  }, [refreshLayers, withCanvas]);

  const addText = useCallback(async (style = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fontFamily = style.fontFamily || "Inter";
    await ensureFontLoaded(fontFamily);
    const textbox = new fabric.Textbox(style.text || "Your text", {
      left: canvas.getWidth() / 2 - 140,
      top: canvas.getHeight() / 2 - 26,
      width: 280,
      fontFamily,
      fill: style.fill || "#111827",
      fontSize: style.fontSize || 32,
      fontWeight: style.fontWeight || "normal",
      fontStyle: style.fontStyle || "normal",
      charSpacing: style.charSpacing || 0,
      lineHeight: style.lineHeight || 1.2,
      underline: !!style.underline,
      shadow: style.shadow || null,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
    });
    if (style.useGradient) {
      textbox.set("fill", new fabric.Gradient({
        type: "linear",
        gradientUnits: "pixels",
        coords: { x1: 0, y1: 0, x2: textbox.width || 280, y2: 0 },
        colorStops: [{ offset: 0, color: "#7B2FF7" }, { offset: 1, color: "#F107A3" }],
      }));
    }
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.requestRenderAll();
    historyRef.current?.save();
    refreshLayers();
    scheduleAutosave();
  }, [ensureFontLoaded, refreshLayers, scheduleAutosave]);

  const setTextFont = useCallback(async (fontName) => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active || (active.type !== "textbox" && active.type !== "text")) return;
    await ensureFontLoaded(fontName);
    active.set({ fontFamily: fontName });
    canvas.requestRenderAll();
    historyRef.current?.save();
    scheduleAutosave();
  }, [ensureFontLoaded, scheduleAutosave]);

  const uploadImages = useCallback((files) => {
    const accepted = files.filter((file) => /image\/(jpeg|png|webp|svg\+xml|gif)/.test(file.type));
    const next = accepted.map((file) => ({ id: generateId(), name: file.name, file, url: URL.createObjectURL(file) }));
    setImages((prev) => [...next, ...prev].slice(0, 40));
  }, []);

  const addImageToCanvas = useCallback((image) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    fabric.Image.fromURL(image.url, (img) => {
      if (!img) {
        onNotice?.({ type: "error", message: "Failed to load image." });
        return;
      }
      img.set({ left: canvas.getWidth() / 2 - (img.width || 120) / 2, top: canvas.getHeight() / 2 - (img.height || 120) / 2, crossOrigin: "anonymous" });
      const max = 360;
      const ratio = Math.min(max / (img.width || 1), max / (img.height || 1), 1);
      img.scale(ratio);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      historyRef.current?.save();
      refreshLayers();
      scheduleAutosave();
    }, { crossOrigin: "anonymous" });
  }, [onNotice, refreshLayers, scheduleAutosave]);

  const setBgColor = useCallback((color) => {
    withCanvas((canvas) => {
      canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
      setBackgroundColor(color);
      setRecentColors((prev) => [color, ...prev.filter((x) => x !== color)].slice(0, 8));
      historyRef.current?.save();
    });
  }, [withCanvas]);

  const setBgGradient = useCallback((grad) => {
    withCanvas((canvas) => {
      const gradient = new fabric.Gradient({
        type: "linear",
        gradientUnits: "pixels",
        coords: { x1: 0, y1: 0, x2: canvasWidth, y2: canvasHeight },
        colorStops: [{ offset: 0, color: grad[0] }, { offset: 1, color: grad[1] }],
      });
      canvas.setBackgroundColor(gradient, canvas.renderAll.bind(canvas));
      historyRef.current?.save();
    });
  }, [canvasHeight, canvasWidth, withCanvas]);

  const setTransparentBg = useCallback(() => {
    withCanvas((canvas) => {
      canvas.setBackgroundColor("rgba(0,0,0,0)", canvas.renderAll.bind(canvas));
      setBackgroundColor("#000000");
      historyRef.current?.save();
    });
  }, [withCanvas]);

  const updateSelected = useCallback((patch) => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set(patch);
    obj.setCoords?.();
    canvas.requestRenderAll();
    setSelectedObject({ ...obj });
    historyRef.current?.save();
    scheduleAutosave();
    refreshLayers();
  }, [refreshLayers, scheduleAutosave]);

  const arrangeSelected = useCallback((mode) => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    if (mode === "front") canvas.bringToFront(obj);
    if (mode === "back") canvas.sendToBack(obj);
    if (mode === "forward") canvas.bringForward(obj);
    if (mode === "backward") canvas.sendBackwards(obj);
    canvas.requestRenderAll();
    historyRef.current?.save();
    refreshLayers();
    scheduleAutosave();
  }, [refreshLayers, scheduleAutosave]);

  const requestConfirm = useCallback((config, action) => {
    pendingConfirmActionRef.current = action;
    setConfirmState({
      open: true,
      title: config.title,
      message: config.message,
      confirmLabel: config.confirmLabel || "Confirm",
    });
  }, []);

  const closeConfirm = useCallback(() => {
    pendingConfirmActionRef.current = null;
    setConfirmState((current) => ({ ...current, open: false }));
  }, []);

  const confirmPendingAction = useCallback(() => {
    const action = pendingConfirmActionRef.current;
    pendingConfirmActionRef.current = null;
    setConfirmState((current) => ({ ...current, open: false }));
    action?.();
  }, []);

  const loadTemplate = useCallback((template) => {
    const applyTemplate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setCanvasWidth(template.canvasWidth);
      setCanvasHeight(template.canvasHeight);
      canvas.loadFromJSON(template.fabricJSON, () => {
        canvas.setWidth(template.canvasWidth * zoom);
        canvas.setHeight(template.canvasHeight * zoom);
        canvas.renderAll();
        historyRef.current?.clear();
        historyRef.current?.save();
        refreshLayers();
        scheduleAutosave();
        onNotice?.({ type: "success", message: `Template '${template.name}' loaded.` });
      });
    };

    if (isDirtyRef.current) {
      requestConfirm(
        {
          title: "Replace current design?",
          message: "Unsaved changes will be replaced by this template.",
          confirmLabel: "Replace",
        },
        applyTemplate,
      );
      return;
    }

    applyTemplate();
  }, [onNotice, refreshLayers, requestConfirm, scheduleAutosave, zoom]);

  const copySelected = useCallback(() => {
    const active = canvasRef.current?.getActiveObject();
    if (!active) return;
    active.clone((cloned) => {
      clipboardRef.current = cloned;
      onNotice?.({ type: "info", message: "Selection copied." });
    });
  }, [onNotice]);

  const pasteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !clipboardRef.current) return;
    clipboardRef.current.clone((clonedObj) => {
      canvas.discardActiveObject();
      clonedObj.set({ left: (clonedObj.left || 0) + 10, top: (clonedObj.top || 0) + 10, evented: true });
      if (clonedObj.type === "activeSelection") {
        clonedObj.canvas = canvas;
        clonedObj.forEachObject((obj) => canvas.add(obj));
        clonedObj.setCoords();
      } else {
        canvas.add(clonedObj);
      }
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
      historyRef.current?.save();
      refreshLayers();
      scheduleAutosave();
    });
  }, [refreshLayers, scheduleAutosave]);

  const duplicateSelected = useCallback(() => {
    copySelected();
    window.setTimeout(() => pasteSelected(), 0);
  }, [copySelected, pasteSelected]);

  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    canvas.remove(active);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    historyRef.current?.save();
    refreshLayers();
    scheduleAutosave();
  }, [refreshLayers, scheduleAutosave]);

  const selectAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const selection = new fabric.ActiveSelection(canvas.getObjects(), { canvas });
    canvas.setActiveObject(selection);
    canvas.requestRenderAll();
  }, []);

  const groupSelected = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active || active.type !== "activeSelection") return;
    active.toGroup();
    canvas.requestRenderAll();
    historyRef.current?.save();
    refreshLayers();
  }, [refreshLayers]);

  const ungroupSelected = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active || active.type !== "group") return;
    active.toActiveSelection();
    canvas.requestRenderAll();
    historyRef.current?.save();
    refreshLayers();
  }, [refreshLayers]);

  const nudgeSelected = useCallback((dx, dy) => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set({ left: (obj.left || 0) + dx, top: (obj.top || 0) + dy });
    obj.setCoords?.();
    canvas.requestRenderAll();
    scheduleAutosave();
  }, [scheduleAutosave]);

  const onExport = useCallback((options) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base = sanitizeFilename(options.filename || "logo_design");
    if (options.format === "png") {
      const bg = options.bgMode === "white" ? "#ffffff" : options.bgMode === "transparent" ? "rgba(0,0,0,0)" : undefined;
      exportPNG(canvas, base, options.multiplier, bg);
    }
    if (options.format === "jpeg") exportJPEG(canvas, base, options.multiplier, options.quality, options.jpegBg || "#ffffff");
    if (options.format === "svg") exportSVG(canvas, base);
    if (options.format === "pdf") exportPDF(canvas, base, { orientation: options.orientation, width: canvasWidth, height: canvasHeight, multiplier: 2 });
    onNotice?.({ type: "success", message: `${options.format.toUpperCase()} exported.` });
  }, [canvasHeight, canvasWidth, onNotice]);

  const saveDesign = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaveNameDefault(`design-${new Date().toISOString().slice(0, 10)}`);
    setSaveNameOpen(true);
  }, []);

  const saveDesignWithName = useCallback((inputName) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const name = (inputName || saveNameDefault).trim();
    if (!name) return;
    const item = {
      id: generateId(),
      name,
      timestamp: Date.now(),
      canvasJSON: canvas.toJSON(),
      canvasWidth,
      canvasHeight,
      thumbnail: canvas.toDataURL({ format: "png", multiplier: 0.1 }),
    };
    setSaves((prev) => {
      const next = [item, ...prev].slice(0, 10);
      try {
        window.localStorage.setItem(SAVES_KEY, JSON.stringify(next));
      } catch (error) {
        if (isQuotaExceededError(error)) {
          onNotice?.({ type: "error", message: "Design too large to save. Try removing some images." });
        }
      }
      return next;
    });
    setSaveNameOpen(false);
    onNotice?.({ type: "success", message: "Design saved." });
  }, [canvasHeight, canvasWidth, onNotice, saveNameDefault]);

  const loadSave = useCallback((save) => {
    const applySave = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setCanvasWidth(save.canvasWidth || 800);
      setCanvasHeight(save.canvasHeight || 600);
      canvas.loadFromJSON(save.canvasJSON, () => {
        canvas.renderAll();
        historyRef.current?.clear();
        historyRef.current?.save();
        refreshLayers();
        scheduleAutosave();
        setSavedDesignsOpen(false);
      });
    };

    if (isDirtyRef.current) {
      requestConfirm(
        {
          title: "Replace current design?",
          message: "Unsaved changes will be replaced by the selected saved design.",
          confirmLabel: "Load Design",
        },
        applySave,
      );
      return;
    }

    applySave();
  }, [refreshLayers, requestConfirm, scheduleAutosave]);

  const deleteSave = useCallback((id) => {
    setSaves((prev) => {
      const next = prev.filter((save) => save.id !== id);
      try {
        window.localStorage.setItem(SAVES_KEY, JSON.stringify(next));
      } catch {
        // ignore storage failures while deleting saves
      }
      return next;
    });
  }, []);

  const setZoomSafe = useCallback((value) => {
    setZoom(Math.max(0.25, Math.min(2, value)));
  }, []);

  const zoomToFit = useCallback(() => {
    const fitW = (window.innerWidth - (leftCollapsed ? 120 : 420) - 340) / canvasWidth;
    const fitH = (window.innerHeight - 260) / canvasHeight;
    setZoomSafe(Math.max(0.25, Math.min(2, Math.min(fitW, fitH, 1))));
  }, [canvasHeight, canvasWidth, leftCollapsed, setZoomSafe]);

  const uploadBackgroundImage = useCallback((file) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, (img) => {
      if (!img) {
        onNotice?.({ type: "error", message: "Failed to load background image." });
        URL.revokeObjectURL(url);
        return;
      }
      const scale = Math.max(canvasWidth / (img.width || 1), canvasHeight / (img.height || 1));
      img.set({ selectable: false, evented: false, scaleX: scale, scaleY: scale, left: 0, top: 0, originX: "left", originY: "top" });
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      historyRef.current?.save();
      scheduleAutosave();
      URL.revokeObjectURL(url);
    }, { crossOrigin: "anonymous" });
  }, [canvasHeight, canvasWidth, onNotice, scheduleAutosave]);

  const onLoadFilesFromDrop = useCallback((files) => {
    uploadImages(files);
  }, [uploadImages]);

  const panelProps = {
    onLoadTemplate: loadTemplate,
    onAddShape: addShape,
    onAddIcon: addIcon,
    onAddText: addText,
    onSetTextFont: setTextFont,
    selectedTextObject: selectedObject && (selectedObject.type === "textbox" || selectedObject.type === "text") ? selectedObject : null,
    images,
    onUploadImages: uploadImages,
    onAddImageToCanvas: addImageToCanvas,
    backgroundColor,
    recentColors,
    onSetBackgroundColor: setBgColor,
    onSetBackgroundGradient: setBgGradient,
    onSetTransparent: setTransparentBg,
    layers,
    selectedId: selectedObject?.__layerId,
    onSelectLayer: (id) => {
      const found = layers.find((layer) => layer.id === id);
      if (found && canvasRef.current) {
        canvasRef.current.setActiveObject(found.object);
        canvasRef.current.requestRenderAll();
      }
    },
    onDeleteLayer: (id) => {
      const found = layers.find((layer) => layer.id === id);
      if (!found || !canvasRef.current) return;
      canvasRef.current.remove(found.object);
      canvasRef.current.requestRenderAll();
      refreshLayers();
      scheduleAutosave();
    },
    onToggleVisibility: (id) => {
      const found = layers.find((layer) => layer.id === id);
      if (!found || !canvasRef.current) return;
      found.object.set({ visible: !found.object.visible });
      canvasRef.current.requestRenderAll();
      refreshLayers();
    },
    onToggleLock: (id) => {
      const found = layers.find((layer) => layer.id === id);
      if (!found || !canvasRef.current) return;
      const next = !found.object.lockMovementX;
      found.object.set({ lockMovementX: next, lockMovementY: next, lockScalingX: next, lockScalingY: next, lockRotation: next });
      canvasRef.current.requestRenderAll();
      refreshLayers();
    },
    onMoveLayerUp: (id) => {
      const found = layers.find((layer) => layer.id === id);
      if (!found || !canvasRef.current) return;
      canvasRef.current.bringForward(found.object);
      canvasRef.current.requestRenderAll();
      refreshLayers();
    },
    onMoveLayerDown: (id) => {
      const found = layers.find((layer) => layer.id === id);
      if (!found || !canvasRef.current) return;
      canvasRef.current.sendBackwards(found.object);
      canvasRef.current.requestRenderAll();
      refreshLayers();
    },
    onGroupSelected: groupSelected,
    onUngroupSelected: ungroupSelected,
    onDuplicateSelected: duplicateSelected,
    onDeleteSelected: deleteSelected,
  };

  const inspectorProps = {
    canvasWidth,
    canvasHeight,
    backgroundColor,
    selectedObject,
    onApplyCanvasSize: applyCanvasSize,
    onSetBackgroundColor: setBgColor,
    onSetBackgroundGradient: setBgGradient,
    onUploadBackground: uploadBackgroundImage,
    onUpdateSelected: updateSelected,
    onArrangeSelected: arrangeSelected,
  };

  useKeyboardShortcuts(
    {
      "ctrl+z": () => isActive ? historyRef.current?.undo() : false,
      "ctrl+y": () => isActive ? historyRef.current?.redo() : false,
      "ctrl+s": () => isActive ? (saveDesign(), true) : false,
      "ctrl+shift+s": () => isActive ? (setExportOpen(true), true) : false,
      "ctrl+c": () => isActive ? (copySelected(), true) : false,
      "ctrl+v": () => isActive ? (pasteSelected(), true) : false,
      "ctrl+d": () => isActive ? (duplicateSelected(), true) : false,
      "ctrl+a": () => isActive ? (selectAll(), true) : false,
      "ctrl+g": () => isActive ? (groupSelected(), true) : false,
      "ctrl+shift+g": () => isActive ? (ungroupSelected(), true) : false,
      delete: () => isActive ? (deleteSelected(), true) : false,
      backspace: () => isActive ? (deleteSelected(), true) : false,
      "ctrl++": () => isActive ? (setZoomSafe(zoom + 0.1), true) : false,
      "ctrl+=": () => isActive ? (setZoomSafe(zoom + 0.1), true) : false,
      "ctrl+-": () => isActive ? (setZoomSafe(zoom - 0.1), true) : false,
      "ctrl+0": () => isActive ? (setZoomSafe(Math.min(1, Math.min((window.innerWidth - 420) / canvasWidth, (window.innerHeight - 220) / canvasHeight))), true) : false,
      "ctrl+1": () => isActive ? (setZoomSafe(1), true) : false,
      esc: () => {
        if (!isActive) return false;
        if (preview) {
          setPreview(false);
          return true;
        }
        canvasRef.current?.discardActiveObject();
        canvasRef.current?.requestRenderAll();
        return true;
      },
      arrowleft: () => isActive ? (nudgeSelected(-1, 0), true) : false,
      arrowright: () => isActive ? (nudgeSelected(1, 0), true) : false,
      arrowup: () => isActive ? (nudgeSelected(0, -1), true) : false,
      arrowdown: () => isActive ? (nudgeSelected(0, 1), true) : false,
      "shift+arrowleft": () => isActive ? (nudgeSelected(-10, 0), true) : false,
      "shift+arrowright": () => isActive ? (nudgeSelected(10, 0), true) : false,
      "shift+arrowup": () => isActive ? (nudgeSelected(0, -10), true) : false,
      "shift+arrowdown": () => isActive ? (nudgeSelected(0, 10), true) : false,
      "ctrl+[": () => isActive ? (arrangeSelected("backward"), true) : false,
      "ctrl+]": () => isActive ? (arrangeSelected("forward"), true) : false,
      "ctrl+shift+[": () => isActive ? (arrangeSelected("back"), true) : false,
      "ctrl+shift+]": () => isActive ? (arrangeSelected("front"), true) : false,
      f: () => isActive ? (setPreview((v) => !v), true) : false,
      p: () => isActive ? (setPreview((v) => !v), true) : false,
      t: () => isActive ? (addText({ text: "Text" }), true) : false,
      r: () => isActive ? (addShape("rectangle"), true) : false,
      c: () => isActive ? (addShape("circle"), true) : false,
      l: () => isActive ? (addShape("line"), true) : false,
      g: () => isActive ? (setGridVisible((v) => !v), true) : false,
      "ctrl+shift+h": () => isActive ? (updateSelected({ flipX: !selectedObject?.flipX }), true) : false,
      "ctrl+shift+v": () => isActive ? (updateSelected({ flipY: !selectedObject?.flipY }), true) : false,
    },
    { enabled: true }
  );

  const selectedName = useMemo(() => (selectedObject ? getObjectLabel(selectedObject) : "None"), [selectedObject]);

  return (
    <section className="logo-studio fixed inset-0 top-[var(--navbar-height)] z-30 flex flex-col" style={{ backgroundColor: "var(--logo-bg)", color: "var(--logo-text)" }}>
      <LogoToolbar
        onBack={onBackHome}
        undoCount={historyRef.current?.getUndoCount?.() || 0}
        redoCount={historyRef.current?.getRedoCount?.() || 0}
        onUndo={() => historyRef.current?.undo()}
        onRedo={() => historyRef.current?.redo()}
        onOpenCanvasSize={() => setCanvasSizeOpen(true)}
        zoom={zoom}
        onZoomChange={setZoomSafe}
        gridVisible={gridVisible}
        onToggleGrid={() => setGridVisible((v) => !v)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid((v) => !v)}
        preview={preview}
        onTogglePreview={() => setPreview((v) => !v)}
        onOpenExport={() => setExportOpen(true)}
        onSaveDesign={saveDesign}
        onOpenSaves={() => setSavedDesignsOpen(true)}
        contextTool={contextTool}
        onContextToolChange={setContextTool}
      />

      <div className="flex min-h-0 flex-1">
        {!isMobile && (
          <LogoLeftPanel
            activeTab={activeTab}
            onTabChange={setActiveTab}
            panelProps={panelProps}
            compact={isTablet}
            collapsed={leftCollapsed}
            onToggleCollapse={() => setLeftCollapsed((v) => !v)}
          />
        )}

        <LogoCanvas
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          zoom={zoom}
          gridVisible={gridVisible}
          gridSize={gridSize}
          gridColor="rgba(139, 92, 246, 0.24)"
          snapToGrid={snapToGrid}
          isPreview={preview}
          onReady={onCanvasReady}
          onSelectionChange={setSelectedObject}
          onModified={onCanvasModified}
          onObjectCountChange={setObjectCount}
          onFileDrop={onLoadFilesFromDrop}
          onZoomChange={setZoomSafe}
          onZoomFit={zoomToFit}
        />

        {!isMobile && <LogoRightPanel selectedObject={selectedObject} inspectorProps={inspectorProps} />}
      </div>

      {isMobile && (
        <div className="logo-glass border-t p-2" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(15,15,15,0.96)" }}>
          <div className="grid grid-cols-6 gap-1">
            {["templates", "elements", "text", "images", "background", "layers"].map((tab) => (
              <Btn key={tab} small variant={activeTab === tab ? "primary" : "secondary"} onClick={() => setActiveTab(tab)}>{tab.charAt(0).toUpperCase()}</Btn>
            ))}
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border p-2" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
            <LogoLeftPanel activeTab={activeTab} onTabChange={setActiveTab} panelProps={panelProps} compact={false} />
          </div>
          {selectedObject && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border p-2" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
              <LogoRightPanel selectedObject={selectedObject} inspectorProps={inspectorProps} />
            </div>
          )}
        </div>
      )}

      <LogoBottomBar canvasWidth={canvasWidth} canvasHeight={canvasHeight} objectCount={objectCount} selectedName={selectedName} zoom={zoom} onOpenHistory={() => setSavedDesignsOpen(true)} />

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} canvasWidth={canvasWidth} canvasHeight={canvasHeight} onExport={onExport} />
      <CanvasSizeModal open={canvasSizeOpen} width={canvasWidth} height={canvasHeight} onClose={() => setCanvasSizeOpen(false)} onApply={(w, h) => { applyCanvasSize(w, h); setCanvasSizeOpen(false); }} />
      <SavedDesignsModal open={savedDesignsOpen} onClose={() => setSavedDesignsOpen(false)} saves={saves} onLoad={loadSave} onDelete={deleteSave} />
      <SaveNameModal
        open={saveNameOpen}
        defaultName={saveNameDefault}
        onSave={saveDesignWithName}
        onClose={() => setSaveNameOpen(false)}
      />
      <ConfirmActionModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmPendingAction}
        onClose={closeConfirm}
      />
    </section>
  );
}

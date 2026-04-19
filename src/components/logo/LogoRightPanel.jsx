import ShapeInspector from "./inspector/ShapeInspector.jsx";
import TextInspector from "./inspector/TextInspector.jsx";
import ImageInspector from "./inspector/ImageInspector.jsx";
import CanvasInspector from "./inspector/CanvasInspector.jsx";

export default function LogoRightPanel({ selectedObject, inspectorProps }) {
  const kind = !selectedObject ? "canvas" : selectedObject.type === "textbox" || selectedObject.type === "text" ? "text" : selectedObject.type === "image" ? "image" : "shape";

  return (
    <aside className="right-panel logo-glass logo-panel-enter flex h-full w-[330px] flex-col border-l" style={{ borderColor: "var(--logo-border)", backgroundColor: "var(--logo-surface)" }}>
      <div className="border-b p-4" style={{ borderColor: "var(--logo-border)" }}>
        <h3 className="text-sm font-semibold text-[var(--logo-text)]">Properties</h3>
        <p className="mt-1 text-xs text-[var(--logo-muted)]">{selectedObject ? `${selectedObject.type} selected` : "Canvas settings"}</p>
      </div>
      <div className="properties-scroll-area panel-content flex-1 overflow-y-auto p-4">
        {kind === "canvas" && <CanvasInspector {...inspectorProps} />}
        {kind === "shape" && <ShapeInspector {...inspectorProps} />}
        {kind === "text" && <TextInspector {...inspectorProps} />}
        {kind === "image" && <ImageInspector {...inspectorProps} />}
      </div>
    </aside>
  );
}

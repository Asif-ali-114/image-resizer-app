import { fabric } from "fabric";

const SAFE_NAME = /[^a-zA-Z0-9.-]/g;

export function sanitizeFilename(name = "design") {
  return String(name).trim().replace(/\s+/g, "_").replace(SAFE_NAME, "_") || "design";
}

export function buildFilename(name, ext) {
  return `${sanitizeFilename(name)}.${ext}`;
}

export function generateStarPoints(points = 5, outerRadius = 60, innerRadius = 30) {
  const result = [];
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    result.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }
  return result;
}

export function centerObject(canvas, obj) {
  obj.set({
    left: canvas.getWidth() / 2 - (obj.width || 120) * (obj.scaleX || 1) / 2,
    top: canvas.getHeight() / 2 - (obj.height || 120) * (obj.scaleY || 1) / 2,
  });
}

export function createShape(type, options = {}) {
  const fill = options.fill || "rgba(var(--color-primary), 0.85)";
  const base = {
    fill,
    stroke: options.stroke || undefined,
    strokeWidth: options.strokeWidth || 0,
    left: options.left || 0,
    top: options.top || 0,
  };

  switch (type) {
    case "rectangle":
      return new fabric.Rect({ ...base, width: 140, height: 96, rx: 12, ry: 12 });
    case "square":
      return new fabric.Rect({ ...base, width: 120, height: 120, rx: 10, ry: 10 });
    case "circle":
      return new fabric.Circle({ ...base, radius: 60 });
    case "ellipse":
      return new fabric.Ellipse({ ...base, rx: 80, ry: 50 });
    case "triangle":
      return new fabric.Triangle({ ...base, width: 130, height: 110 });
    case "diamond":
      return new fabric.Polygon([
        { x: 60, y: 0 },
        { x: 120, y: 60 },
        { x: 60, y: 120 },
        { x: 0, y: 60 },
      ], base);
    case "pentagon":
      return new fabric.Polygon(generateRegularPolygon(5, 65), base);
    case "hexagon":
      return new fabric.Polygon(generateRegularPolygon(6, 65), base);
    case "star-5":
      return new fabric.Polygon(generateStarPoints(5, 64, 30), base);
    case "star-6":
      return new fabric.Polygon(generateStarPoints(6, 64, 30), base);
    case "heart":
      return new fabric.Path("M 0 -30 C 0 -60 -50 -60 -50 -20 C -50 20 0 50 0 80 C 0 50 50 20 50 -20 C 50 -60 0 -60 0 -30", {
        ...base,
        scaleX: 1.2,
        scaleY: 1.2,
      });
    case "rounded-rectangle":
      return new fabric.Rect({ ...base, width: 180, height: 90, rx: 28, ry: 28 });
    case "cross":
      return new fabric.Path("M 40 0 L 80 0 L 80 40 L 120 40 L 120 80 L 80 80 L 80 120 L 40 120 L 40 80 L 0 80 L 0 40 L 40 40 Z", base);
    case "speech-bubble":
      return new fabric.Path("M 8 12 Q 8 0 20 0 L 120 0 Q 132 0 132 12 L 132 72 Q 132 84 120 84 L 50 84 L 34 108 L 30 84 L 20 84 Q 8 84 8 72 Z", base);
    case "parallelogram":
      return new fabric.Polygon([
        { x: 30, y: 0 },
        { x: 160, y: 0 },
        { x: 130, y: 100 },
        { x: 0, y: 100 },
      ], base);
    case "trapezoid":
      return new fabric.Polygon([
        { x: 30, y: 0 },
        { x: 130, y: 0 },
        { x: 170, y: 100 },
        { x: 0, y: 100 },
      ], base);
    case "arrow-right":
      return new fabric.Path("M 0 40 L 90 40 L 90 10 L 160 60 L 90 110 L 90 80 L 0 80 Z", base);
    case "arrow-left":
      return new fabric.Path("M 160 40 L 70 40 L 70 10 L 0 60 L 70 110 L 70 80 L 160 80 Z", base);
    case "arrow-up":
      return new fabric.Path("M 40 160 L 40 70 L 10 70 L 60 0 L 110 70 L 80 70 L 80 160 Z", base);
    case "arrow-down":
      return new fabric.Path("M 40 0 L 40 90 L 10 90 L 60 160 L 110 90 L 80 90 L 80 0 Z", base);
    case "line":
      return new fabric.Line([0, 0, 300, 0], { ...base, stroke: options.stroke || "#2D3748", strokeWidth: options.strokeWidth || 2, fill: undefined });
    default:
      return new fabric.Rect({ ...base, width: 120, height: 120 });
  }
}

export function generateRegularPolygon(sides = 6, radius = 60) {
  const pts = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    pts.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }
  return pts;
}

export function getObjectLabel(obj) {
  const type = obj?.type || "object";
  if (type === "textbox" || type === "text") return "Text";
  if (type === "image") return "Image";
  if (type === "group") return "Group";
  if (type === "line") return "Line";
  if (type === "polygon") return "Shape";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

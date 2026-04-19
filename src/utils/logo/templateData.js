const CATEGORIES = [
  "Business & Corporate",
  "Technology & Startup",
  "Food & Restaurant",
  "Health & Wellness",
  "Fashion & Beauty",
  "Sports & Fitness",
  "Education",
  "Real Estate",
  "Creative & Art",
  "Social Media Post",
  "YouTube Thumbnail",
  "Business Card",
  "Banner & Header",
  "All Templates",
];

const PALETTES = [
  ["#1E3A5F", "#4A90D9", "#FFFFFF"],
  ["#111111", "#FFD700", "#F8F8F8"],
  ["#667EEA", "#764BA2", "#FFFFFF"],
  ["#134E5E", "#71B280", "#F0FFF4"],
  ["#1A1A2E", "#E94560", "#FFFFFF"],
  ["#2D3748", "#A0AEC0", "#FFFFFF"],
  ["#7B2FF7", "#F107A3", "#FFFFFF"],
  ["#0F2027", "#2C5364", "#FFFFFF"],
];

function gradientFill(w, h, colors) {
  return {
    type: "linear",
    coords: { x1: 0, y1: 0, x2: w, y2: h },
    colorStops: [
      { offset: 0, color: colors[0] },
      { offset: 1, color: colors[1] },
    ],
  };
}

function makeTemplate(category, index, width, height) {
  const palette = PALETTES[(index + category.length) % PALETTES.length];
  const idPrefix = category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return {
    id: `${idPrefix}-${String(index).padStart(3, "0")}`,
    name: `${category.split("&")[0].trim()} ${index}`,
    category,
    canvasWidth: width,
    canvasHeight: height,
    thumbnail: null,
    fabricJSON: {
      version: "5.0.0",
      objects: [
        { type: "rect", left: 0, top: 0, width, height, fill: gradientFill(width, height, palette), selectable: false },
        {
          type: "textbox",
          text: `${category.toUpperCase()}`,
          left: Math.max(24, width * 0.08),
          top: Math.max(24, height * 0.18),
          width: width * 0.84,
          fontSize: Math.max(24, Math.round(width * 0.055)),
          fontFamily: "Montserrat",
          fill: palette[2],
          fontWeight: "bold",
          charSpacing: 90,
        },
        {
          type: "textbox",
          text: `Template ${index}`,
          left: Math.max(24, width * 0.08),
          top: Math.max(56, height * 0.58),
          width: width * 0.7,
          fontSize: Math.max(16, Math.round(width * 0.03)),
          fontFamily: "Open Sans",
          fill: palette[2],
          opacity: 0.9,
        },
        {
          type: "rect",
          left: Math.max(24, width * 0.08),
          top: Math.max(20, height * 0.12),
          width: Math.max(48, width * 0.18),
          height: Math.max(6, height * 0.02),
          fill: palette[1],
          rx: 999,
          ry: 999,
        },
      ],
    },
  };
}

const SIZE_PRESETS = {
  "Social Media Post": [1080, 1080],
  "YouTube Thumbnail": [1280, 720],
  "Business Card": [900, 500],
  "Banner & Header": [1200, 400],
  "All Templates": [800, 600],
};

const generated = CATEGORIES.flatMap((category, cIdx) => {
  if (category === "All Templates") return [];
  return [1, 2, 3].map((num) => {
    const [w, h] = SIZE_PRESETS[category] || [700 + cIdx * 12, 360 + cIdx * 6];
    return makeTemplate(category, cIdx * 10 + num, w, h);
  });
});

export const TEMPLATES = [
  {
    id: "corp-001",
    name: "Corporate Blue",
    category: "Business & Corporate",
    canvasWidth: 800,
    canvasHeight: 400,
    thumbnail: null,
    fabricJSON: {
      version: "5.0.0",
      objects: [
        { type: "rect", left: 0, top: 0, width: 800, height: 400, fill: "#1E3A5F", selectable: false },
        { type: "textbox", text: "COMPANY NAME", left: 80, top: 150, fontSize: 48, fontFamily: "Montserrat", fill: "#FFFFFF", fontWeight: "bold" },
        { type: "textbox", text: "Your Professional Tagline", left: 80, top: 220, fontSize: 18, fontFamily: "Open Sans", fill: "#A8C4E0" },
        { type: "rect", left: 80, top: 140, width: 60, height: 6, fill: "#4A90D9", rx: 3, ry: 3 },
      ],
    },
  },
  {
    id: "tech-001",
    name: "Tech Gradient",
    category: "Technology & Startup",
    canvasWidth: 600,
    canvasHeight: 300,
    thumbnail: null,
    fabricJSON: {
      version: "5.0.0",
      objects: [
        { type: "rect", left: 0, top: 0, width: 600, height: 300, fill: gradientFill(600, 300, ["#667eea", "#764ba2"]), selectable: false },
        { type: "polygon", points: [{ x: 0, y: 30 }, { x: 26, y: 0 }, { x: 52, y: 0 }, { x: 78, y: 30 }, { x: 52, y: 60 }, { x: 26, y: 60 }], left: 60, top: 100, fill: "rgba(255,255,255,0.2)", stroke: "#FFFFFF", strokeWidth: 2 },
        { type: "textbox", text: "NEXUS", left: 170, top: 90, fontSize: 64, fontFamily: "Arial", fill: "#FFFFFF", fontWeight: "bold" },
        { type: "textbox", text: "Technology Solutions", left: 170, top: 170, fontSize: 20, fontFamily: "Arial", fill: "rgba(255,255,255,0.8)" },
      ],
    },
  },
  {
    id: "social-001",
    name: "Instagram Square",
    category: "Social Media Post",
    canvasWidth: 1080,
    canvasHeight: 1080,
    thumbnail: null,
    fabricJSON: {
      version: "5.0.0",
      objects: [
        { type: "rect", left: 0, top: 0, width: 1080, height: 1080, fill: gradientFill(1080, 1080, ["#F093FB", "#F5576C"]), selectable: false },
        { type: "textbox", text: "YOUR TITLE\nHERE", left: 100, top: 380, width: 840, fontSize: 120, fontFamily: "Arial", fill: "#FFFFFF", fontWeight: "bold", lineHeight: 1.2 },
        { type: "textbox", text: "@yourusername", left: 100, top: 900, fontSize: 48, fontFamily: "Arial", fill: "rgba(255,255,255,0.8)" },
      ],
    },
  },
  ...generated,
];

export const TEMPLATE_CATEGORIES = [
  "All Templates",
  "Business & Corporate",
  "Technology & Startup",
  "Food & Restaurant",
  "Health & Wellness",
  "Fashion & Beauty",
  "Sports & Fitness",
  "Education",
  "Real Estate",
  "Creative & Art",
  "Social Media Post",
  "YouTube Thumbnail",
  "Business Card",
  "Banner & Header",
];

export function getTemplateById(id) {
  return TEMPLATES.find((template) => template.id === id) || null;
}

export function searchTemplates(query, category = "All Templates") {
  const q = String(query || "").trim().toLowerCase();
  return TEMPLATES.filter((template) => {
    if (category !== "All Templates" && template.category !== category) return false;
    if (!q) return true;
    const hay = `${template.name} ${template.category}`.toLowerCase();
    return hay.includes(q);
  });
}

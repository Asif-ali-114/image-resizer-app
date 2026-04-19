function distSq(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

export function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
  }

  return {
    h: Math.round((h * 60 + 360) % 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function rgbToCmyk(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - rn - k) / (1 - k);
  const m = (1 - gn - k) / (1 - k);
  const y = (1 - bn - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

export function hexToRgb(hex) {
  const clean = String(hex || "").replace("#", "");
  if (clean.length !== 6) return null;
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

const NAMED = [
  { name: "red", r: 255, g: 0, b: 0 },
  { name: "green", r: 0, g: 128, b: 0 },
  { name: "blue", r: 0, g: 0, b: 255 },
  { name: "black", r: 0, g: 0, b: 0 },
  { name: "white", r: 255, g: 255, b: 255 },
  { name: "orange", r: 255, g: 165, b: 0 },
  { name: "purple", r: 128, g: 0, b: 128 },
  { name: "yellow", r: 255, g: 255, b: 0 },
  { name: "teal", r: 0, g: 128, b: 128 },
  { name: "pink", r: 255, g: 192, b: 203 },
];

export function getColorName(r, g, b) {
  let best = NAMED[0];
  let bestDist = Infinity;
  NAMED.forEach((item) => {
    const d = distSq({ r, g, b }, item);
    if (d < bestDist) {
      best = item;
      bestDist = d;
    }
  });
  return best.name;
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function sampleStride(quality) {
  if (quality === "fast") return 16;
  if (quality === "precise") return 4;
  return 8;
}

export function extractPalette(imageData, k, quality = "balanced", includeLight = true, includeDark = true) {
  const data = imageData.data || [];
  const collectPoints = (strideBytes) => {
    const gathered = [];
    for (let i = 0; i < data.length; i += strideBytes) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (!includeLight && r > 245 && g > 245 && b > 245) continue;
      if (!includeDark && r < 10 && g < 10 && b < 10) continue;
      gathered.push({ r, g, b });
    }
    return gathered;
  };

  let points = collectPoints(sampleStride(quality) * 4);
  if (points.length < k) {
    points = collectPoints(4);
  }

  if (!points.length) return [];
  const centroids = points.slice(0, k).map((p) => ({ ...p }));

  for (let iter = 0; iter < 20; iter++) {
    const groups = Array.from({ length: centroids.length }, () => []);
    points.forEach((p) => {
      let idx = 0;
      let dBest = Infinity;
      centroids.forEach((c, i) => {
        const d = distSq(p, c);
        if (d < dBest) {
          dBest = d;
          idx = i;
        }
      });
      groups[idx].push(p);
    });

    centroids.forEach((c, i) => {
      if (!groups[i].length) return;
      const sum = groups[i].reduce((acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }), { r: 0, g: 0, b: 0 });
      c.r = Math.round(sum.r / groups[i].length);
      c.g = Math.round(sum.g / groups[i].length);
      c.b = Math.round(sum.b / groups[i].length);
      c.frequency = groups[i].length;
    });
  }

  return centroids
    .map((c) => ({
      hex: rgbToHex(c.r, c.g, c.b),
      rgb: { r: c.r, g: c.g, b: c.b },
      hsl: rgbToHsl(c.r, c.g, c.b),
      cmyk: rgbToCmyk(c.r, c.g, c.b),
      frequency: c.frequency || 0,
      name: getColorName(c.r, c.g, c.b),
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, k);
}

export function generatePaletteName(colors) {
  const warm = colors.filter((c) => c.hsl.h < 80 || c.hsl.h > 300).length;
  const cool = colors.filter((c) => c.hsl.h >= 80 && c.hsl.h <= 260).length;
  if (warm > cool) return "Golden Hour";
  if (cool > warm) return "Ocean Depth";
  return "Urban Fog";
}

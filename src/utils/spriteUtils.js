export function sanitizeCssClassName(name) {
  return String(name || "sprite")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "sprite";
}

export function packSprites(items, { padding = 0, outerPadding = 0, maxWidth = 2048 } = {}) {
  const sorted = [...items].sort((a, b) => b.height - a.height);
  const packed = [];
  let x = outerPadding;
  let y = outerPadding;
  let shelfHeight = 0;
  let sheetW = 0;

  sorted.forEach((item) => {
    if (x + item.width + outerPadding > maxWidth && x > outerPadding) {
      x = outerPadding;
      y += shelfHeight + padding;
      shelfHeight = 0;
    }

    packed.push({ ...item, x, y });
    x += item.width + padding;
    shelfHeight = Math.max(shelfHeight, item.height);
    sheetW = Math.max(sheetW, x);
  });

  const sheetH = y + shelfHeight + outerPadding;
  return { packed, width: Math.max(1, sheetW + outerPadding - padding), height: Math.max(1, sheetH) };
}

export function generateCssClass({ classPrefix = "sprite-", spriteName, x, y, width, height }) {
  const cls = `${classPrefix}${sanitizeCssClassName(spriteName)}`;
  return `.${cls} { width: ${width}px; height: ${height}px; background-position: -${x}px -${y}px; }`;
}

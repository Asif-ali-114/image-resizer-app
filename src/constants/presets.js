export const PRESETS = {
  Instagram: [
    { name: "Post (Square)", w: 1080, h: 1080, fmt: "JPG" },
    { name: "Story / Reel", w: 1080, h: 1920, fmt: "JPG" },
    { name: "Profile Photo", w: 320, h: 320, fmt: "JPG" },
  ],
  TikTok: [
    { name: "Video Cover", w: 1080, h: 1920, fmt: "JPG" },
    { name: "Profile Photo", w: 200, h: 200, fmt: "JPG" },
  ],
  YouTube: [
    { name: "Channel Banner", w: 2560, h: 1440, fmt: "PNG" },
    { name: "Thumbnail", w: 1280, h: 720, fmt: "JPG" },
  ],
  LinkedIn: [
    { name: "Cover Photo", w: 1584, h: 396, fmt: "JPG" },
    { name: "Post Image", w: 1200, h: 627, fmt: "JPG" },
  ],
  "Twitter/X": [
    { name: "Header Photo", w: 1500, h: 500, fmt: "JPG" },
    { name: "Post Image", w: 1200, h: 675, fmt: "JPG" },
  ],
  Pinterest: [{ name: "Standard Pin", w: 1000, h: 1500, fmt: "JPG" }],
  Facebook: [{ name: "Cover Photo", w: 820, h: 312, fmt: "JPG" }],
  Shopify: [{ name: "Product Image", w: 2048, h: 2048, fmt: "JPG" }],
  Etsy: [{ name: "Product Listing", w: 2000, h: 2000, fmt: "JPG" }],
  Amazon: [{ name: "Product Main", w: 2000, h: 2000, fmt: "JPG" }],
  WhatsApp: [{ name: "Profile Photo", w: 500, h: 500, fmt: "JPG" }],
};

export const ICONS = {
  Instagram: "📸",
  TikTok: "🎵",
  YouTube: "▶️",
  LinkedIn: "💼",
  "Twitter/X": "𝕏",
  Pinterest: "📌",
  Facebook: "👥",
  Shopify: "🛍️",
  Etsy: "🏺",
  Amazon: "📦",
  WhatsApp: "💬",
};

export const SIZE_PRESETS = [
  { label: "Email-ready", target: 500 },
  { label: "Web-optimized", target: 200 },
  { label: "WhatsApp", target: 5000 },
];

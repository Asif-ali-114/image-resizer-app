const DEFAULT_PATH = "M3 12h18M12 3v18M5 5l14 14M19 5L5 19";

const ICON_GROUPS = {
  "Business & Finance": ["briefcase", "chart-bar", "chart-line", "chart-pie", "coin", "credit-card", "dollar-sign", "handshake", "office-building", "presentation", "receipt", "safe", "scales", "shopping-bag", "smartphone-payment", "stock-up", "target", "trophy", "wallet", "world-map"],
  Technology: ["battery", "bluetooth", "chip", "cloud", "code-brackets", "cursor", "database", "download", "folder", "gear", "globe", "headphones", "keyboard", "laptop", "lock", "monitor", "mouse", "network", "phone", "wifi"],
  "Food & Drink": ["apple", "beer", "bread", "cake", "chef-hat", "coffee-cup", "cocktail", "fork-knife", "hamburger", "ice-cream", "leaf", "orange", "pizza", "popcorn", "salad", "soda", "sushi", "tea-cup", "wine-glass", "wrap"],
  "Health & Medical": ["bandage", "brain", "dna", "first-aid", "heart-pulse", "hospital", "lungs", "medical-cross", "microscope", "pill", "running-person", "shield-health", "stethoscope", "tooth", "yoga"],
  "Nature & Environment": ["cloud-rain", "flower", "forest", "lightning-bolt", "mountain", "ocean-wave", "palm-tree", "recycle", "snowflake", "sun", "sunflower", "tree", "water-drop", "wind", "fire"],
  "People & Social": ["camera", "chat-bubble", "community", "crown", "envelope", "flag", "graduation-cap", "home", "key", "location-pin", "megaphone", "microphone", "music-note", "pen", "star-rating"],
  "Creative & Design": ["brush", "color-palette", "diamond", "eye", "film-reel", "frame", "layers", "magic-wand", "paint-bucket", "pencil", "ruler", "scissors", "shapes", "spotlight", "triangle-ruler"],
  Transport: ["airplane", "bicycle", "boat", "bus", "car", "helicopter", "motorcycle", "rocket", "train", "truck", "van", "compass", "anchor", "hot-air-balloon", "skateboard"],
  Sports: ["baseball", "basketball", "bowling", "boxing-glove", "cricket", "cycling", "dumbbell", "football", "golf", "medal", "podium", "soccer-ball", "swimming", "tennis", "volleyball"],
  "Symbols & Misc": ["check-circle", "clock", "compass-rose", "crown-alt", "gem", "gift", "infinity", "lightning", "map", "percent", "puzzle", "quote-left", "shield", "sparkles", "zap"],
  "Abstract Extras": Array.from({ length: 50 }, (_, i) => `abstract-${i + 1}`),
};

const STROKE_PATHS = {
  star: "M12 2l2.9 6 6.6.9-4.8 4.6 1.2 6.6L12 17l-5.9 3.1 1.2-6.6L2.5 8.9 9.1 8z",
  circle: "M12 2a10 10 0 100 20 10 10 0 000-20z",
  square: "M4 4h16v16H4z",
  triangle: "M12 4l8 16H4z",
};

function pickPath(name) {
  if (name.includes("star") || name.includes("spark")) return STROKE_PATHS.star;
  if (name.includes("circle") || name.includes("coin") || name.includes("ball")) return STROKE_PATHS.circle;
  if (name.includes("square") || name.includes("frame")) return STROKE_PATHS.square;
  if (name.includes("triangle") || name.includes("arrow")) return STROKE_PATHS.triangle;
  return DEFAULT_PATH;
}

export const ICONS = Object.entries(ICON_GROUPS).reduce((acc, [category, names]) => {
  names.forEach((name) => {
    acc[name] = {
      name,
      category,
      path: pickPath(name),
      viewBox: "0 0 24 24",
    };
  });
  return acc;
}, {});

export const ICON_LIST = Object.values(ICONS);

export const ICON_CATEGORIES = Object.keys(ICON_GROUPS);

export function searchIcons(query = "", category = "All") {
  const q = String(query).trim().toLowerCase();
  return ICON_LIST.filter((icon) => {
    if (category !== "All" && icon.category !== category) return false;
    if (!q) return true;
    return `${icon.name} ${icon.category}`.toLowerCase().includes(q);
  });
}

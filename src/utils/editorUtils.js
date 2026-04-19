export function clampAdjust(value, min = -100, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

export function applyBrightness(value) {
  const v = clampAdjust(value);
  return (100 + v) / 100;
}

export function rgbShiftForTemperature(r, g, b, temperature) {
  const t = clampAdjust(temperature);
  const shift = Math.round((t / 100) * 35);
  return {
    r: Math.max(0, Math.min(255, r + shift)),
    g,
    b: Math.max(0, Math.min(255, b - shift)),
  };
}

export function filterStringFromAdjustments({
  brightness = 0,
  contrast = 0,
  saturation = 0,
  blur = 0,
  hue = 0,
  presetFilter = "none",
}) {
  const base = [
    `brightness(${applyBrightness(brightness)})`,
    `contrast(${(100 + clampAdjust(contrast)) / 100})`,
    `saturate(${(100 + clampAdjust(saturation)) / 100})`,
    `blur(${Math.max(0, Number(blur) || 0)}px)`,
    `hue-rotate(${Math.max(0, Number(hue) || 0)}deg)`,
  ];

  const presets = {
    none: "",
    vivid: "saturate(1.4) contrast(1.1) brightness(1.05)",
    chrome: "contrast(1.2) brightness(1.05) saturate(0.9)",
    fade: "contrast(0.85) brightness(1.1) saturate(0.75)",
    noir: "grayscale(1) contrast(1.3) brightness(0.9)",
    warm: "sepia(0.3) saturate(1.2) brightness(1.05)",
    cool: "hue-rotate(200deg) saturate(0.9) brightness(1)",
    vintage: "sepia(0.5) contrast(0.85) brightness(0.9) saturate(0.8)",
    sepia: "sepia(1) contrast(1.1)",
    dramatic: "contrast(1.5) brightness(0.9) saturate(1.2) grayscale(0.2)",
  };

  const preset = presets[presetFilter] || "";
  return `${base.join(" ")} ${preset}`.trim();
}

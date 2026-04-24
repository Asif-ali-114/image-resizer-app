export function clampAdjust(value, min = -100, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function signedSoftStep(value, gamma = 1.35) {
  if (value === 0) return 0;
  return Math.sign(value) * Math.pow(Math.abs(value), gamma);
}

function scaleAroundOne(value, {
  inMin = -100,
  inMax = 100,
  strength = 0.2,
  outMin = 0.8,
  outMax = 1.2,
  gamma = 1.35,
} = {}) {
  const clamped = clampAdjust(value, inMin, inMax);
  const normalized = inMax === 0 ? 0 : clamped / inMax;
  const eased = signedSoftStep(normalized, gamma);
  const scaled = 1 + (eased * strength);
  return clampNumber(scaled, outMin, outMax);
}

export function applyBrightness(value) {
  return scaleAroundOne(value, {
    strength: 0.18,
    outMin: 0.82,
    outMax: 1.18,
    gamma: 1.4,
  });
}

export function rgbShiftForTemperature(r, g, b, temperature) {
  const t = clampAdjust(temperature);
  const shift = Math.round((t / 100) * 18);
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
  sharpness = 0,
  highlights = 0,
  shadows = 0,
  temperature = 0,
  vignette = 0,
  presetFilter = "none",
}) {
  const baseBrightness = applyBrightness(brightness);
  const baseContrast = scaleAroundOne(contrast, {
    strength: 0.18,
    outMin: 0.84,
    outMax: 1.2,
    gamma: 1.45,
  });
  const baseSaturation = scaleAroundOne(saturation, {
    strength: 0.2,
    outMin: 0.82,
    outMax: 1.22,
    gamma: 1.35,
  });

  const base = [
    // Keep a stable, predictable pipeline: brightness -> contrast -> saturation -> others.
    `brightness(${baseBrightness.toFixed(3)})`,
    `contrast(${baseContrast.toFixed(3)})`,
    `saturate(${baseSaturation.toFixed(3)})`,
    `blur(${Math.max(0, Number(blur) || 0)}px)`,
    `hue-rotate(${Math.max(0, Number(hue) || 0)}deg)`,
  ];

  if (sharpness > 0) {
    const s = clampAdjust(sharpness, 0, 100);
    const contrastBoost = 1 + (s / 100) * 0.12;
    const brightnessComp = 1 - (s / 100) * 0.03;
    base.push(`contrast(${contrastBoost.toFixed(3)})`);
    base.push(`brightness(${brightnessComp.toFixed(3)})`);
  }

  if (highlights !== 0) {
    const hlBrightness = scaleAroundOne(highlights, {
      strength: 0.1,
      outMin: 0.9,
      outMax: 1.1,
      gamma: 1.5,
    });
    base.push(`brightness(${hlBrightness.toFixed(3)})`);
  }

  if (shadows !== 0) {
    const shadowBrightness = scaleAroundOne(shadows, {
      strength: 0.12,
      outMin: 0.88,
      outMax: 1.12,
      gamma: 1.5,
    });
    base.push(`brightness(${shadowBrightness.toFixed(3)})`);
  }

  if (temperature !== 0) {
    const t = clampAdjust(temperature);
    if (t > 0) {
      const sepiaAmount = (t / 100) * 0.2;
      base.push(`sepia(${sepiaAmount.toFixed(3)})`);
    } else {
      const hueShift = Math.abs(t / 100) * 16;
      const desat = 1 - Math.abs(t / 100) * 0.08;
      base.push(`hue-rotate(${hueShift.toFixed(1)}deg)`);
      base.push(`saturate(${desat.toFixed(3)})`);
    }
  }

  if (vignette > 0) {
    const v = clampAdjust(vignette, 0, 100);
    const shadowAlpha = 0.04 + (v / 100) * 0.12;
    const shadowBlur = 6 + Math.round((v / 100) * 14);
    base.push(`drop-shadow(0 0 ${shadowBlur}px rgba(0,0,0,${shadowAlpha.toFixed(3)}))`);
  }

  const presets = {
    none: "",
    vivid: "saturate(1.14) contrast(1.08) brightness(1.03)",
    chrome: "contrast(1.12) brightness(1.02) saturate(0.94)",
    fade: "contrast(0.92) brightness(1.05) saturate(0.88)",
    noir: "grayscale(0.95) contrast(1.12) brightness(0.96)",
    warm: "sepia(0.16) saturate(1.08) brightness(1.03)",
    cool: "hue-rotate(168deg) saturate(0.96) brightness(1.01)",
    vintage: "sepia(0.24) contrast(0.93) brightness(0.98) saturate(0.9)",
    sepia: "sepia(0.55) contrast(1.04)",
    dramatic: "contrast(1.2) brightness(0.95) saturate(1.06) grayscale(0.1)",
  };

  const preset = presets[presetFilter] || "";
  return `${base.join(" ")} ${preset}`.trim();
}

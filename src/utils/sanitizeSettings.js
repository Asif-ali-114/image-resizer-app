export function sanitizeSettings(raw) {
  const prefersDark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const next = raw && typeof raw === 'object' ? raw : {};

  const qualityRaw = Number(next.quality);
  const quality = Number.isFinite(qualityRaw) ? Math.round(qualityRaw) : 85;

  const formatRaw = typeof next.format === 'string' ? next.format.toLowerCase() : 'jpeg';
  const formatAlias =
    formatRaw === 'jpg' ? 'jpeg' : formatRaw === 'webp' ? 'webp' : formatRaw;
  const format = ['jpeg', 'png', 'webp'].includes(formatAlias)
    ? formatAlias
    : 'jpeg';

  const jpgBackground =
    typeof next.jpgBackground === 'string' &&
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(next.jpgBackground)
      ? next.jpgBackground
      : '#ffffff';

  const theme = next.theme === 'light' || next.theme === 'dark'
    ? next.theme
    : prefersDark
      ? 'dark'
      : 'light';

  return {
    quality: Math.min(100, Math.max(1, quality)),
    format,
    jpgBackground,
    theme,
  };
}

export function sanitizeTheme(rawTheme) {
  if (rawTheme === 'dark' || rawTheme === 'light') return rawTheme;
  const prefersDark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

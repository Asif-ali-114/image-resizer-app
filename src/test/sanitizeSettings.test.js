import { describe, expect, it, vi } from 'vitest';
import { sanitizeSettings, sanitizeTheme } from '../utils/sanitizeSettings.js';

describe('sanitize settings helpers', () => {
  it('normalizes bad values and keeps valid values', () => {
    const out = sanitizeSettings({
      quality: '999',
      format: 'JPG',
      jpgBackground: '#abc',
      theme: 'dark',
    });

    expect(out).toEqual({
      quality: 100,
      format: 'jpeg',
      jpgBackground: '#abc',
      theme: 'dark',
    });
  });

  it('falls back to defaults when values are missing or invalid', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: false }),
    });

    const out = sanitizeSettings({
      quality: 'bad',
      format: 'invalid',
      jpgBackground: 'red',
      theme: 'invalid',
    });

    expect(out).toEqual({
      quality: 85,
      format: 'jpeg',
      jpgBackground: '#ffffff',
      theme: 'light',
    });
  });

  it('sanitizes theme-only values', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true }),
    });

    expect(sanitizeTheme('light')).toBe('light');
    expect(sanitizeTheme('dark')).toBe('dark');
    expect(sanitizeTheme('unknown')).toBe('dark');
  });
});

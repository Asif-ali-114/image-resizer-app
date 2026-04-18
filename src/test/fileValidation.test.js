import { describe, expect, it, vi } from 'vitest';
import { magicTypeFromHeader, validateImageFile } from '../utils/fileValidation.js';

describe('validateImageFile', () => {
  function mockReaderWithBytes(bytes) {
    global.FileReader = class {
      constructor() {
        this.onload = null;
        this.onerror = null;
      }

      readAsArrayBuffer() {
        this.result = new Uint8Array(bytes).buffer;
        this.onload?.();
      }
    };
  }

  it('accepts a valid JPEG file', async () => {
    mockReaderWithBytes([0xff, 0xd8, 0xff, 0xe0]);
    const file = {
      size: 1024,
      type: 'image/jpeg',
      slice: vi.fn(() => ({})),
    };

    const result = await validateImageFile(file);
    expect(result.ok).toBe(true);
  });

  it('rejects oversized files', async () => {
    const file = {
      size: 21 * 1024 * 1024,
      type: 'image/jpeg',
      slice: vi.fn(() => ({})),
    };

    const result = await validateImageFile(file);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/20MB/);
  });

  it('rejects unsupported mime type', async () => {
    const file = {
      size: 2000,
      type: 'application/pdf',
      slice: vi.fn(() => ({})),
    };

    const result = await validateImageFile(file);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Format not supported/);
  });
});

describe('magicTypeFromHeader', () => {
  it('detects JPEG header', () => {
    expect(magicTypeFromHeader(new Uint8Array([0xff, 0xd8, 0xff, 0xe1]))).toBe('image/jpeg');
  });

  it('detects PNG header', () => {
    expect(magicTypeFromHeader(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe('image/png');
  });

  it('returns null for mismatched bytes', () => {
    expect(magicTypeFromHeader(new Uint8Array([0x00, 0x11, 0x22, 0x33]))).toBe(null);
  });
});

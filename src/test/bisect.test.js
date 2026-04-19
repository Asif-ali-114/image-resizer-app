import { describe, expect, it } from 'vitest';
import { bisectQuality } from '../utils/bisect.js';

describe('bisectQuality', () => {
  it('returns the highest blob under target size when available', async () => {
    const encodeFn = async (quality) =>
      new Blob([new Uint8Array(quality * 10)], { type: 'image/jpeg' });

    const best = await bisectQuality(encodeFn, 0.6, 10);
    expect(best).toBeTruthy();
    expect(best.size / 1024).toBeLessThanOrEqual(0.6);
  });

  it('returns null when every candidate exceeds target size', async () => {
    const encodeFn = async () =>
      new Blob([new Uint8Array(5000)], { type: 'image/jpeg' });

    const best = await bisectQuality(encodeFn, 0.1, 6);
    expect(best).toBeNull();
  });
});

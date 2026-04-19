import { describe, expect, it } from 'vitest';
import { getOutputDimensions } from '../utils/imageUtils.js';

describe('getOutputDimensions', () => {
  it('computes dimensions from percent mode', () => {
    const result = getOutputDimensions(
      { scaleMode: 'percent', pct: 25 },
      4000,
      2000,
    );

    expect(result).toEqual({ width: 1000, height: 500 });
  });

  it('computes dimensions from pixel mode', () => {
    const result = getOutputDimensions(
      { scaleMode: 'pixel', width: 801, height: 602 },
      4000,
      2000,
    );

    expect(result).toEqual({ width: 801, height: 602 });
  });
});

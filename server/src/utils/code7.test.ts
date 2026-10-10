import { describe, it, expect } from 'vitest';
import { generateCode7 } from '../../../shared/contracts/code7';
describe('generateCode7 Utility', () => {
  it('should generate a 7-character string with only uppercase letters and numbers', () => {
    const code = generateCode7();
    
    expect(code).toHaveLength(7);
    expect(code).toMatch(/^[A-Z0-9]{7}$/);
  });

  it('should generate unique codes across 1,000 iterations', () => {
    const iterations = 1000;
    const codes = new Set<string>();

    for (let i = 0; i < iterations; i++) {
      codes.add(generateCode7());
    }

    // A Set only stores unique values, so its size dropping means a duplicate occurred
    expect(codes.size).toBe(iterations);
  });
});
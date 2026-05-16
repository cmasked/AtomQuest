import { computeScore } from '../src/utils/scoreEngine';

describe('computeScore', () => {
  // ─── NUMERIC_MIN (higher is better) ──────────────────────────
  describe('NUMERIC_MIN', () => {
    it('normal: 80 actual / 100 target = 80', () => {
      expect(computeScore({ uomType: 'NUMERIC_MIN', targetValue: 100, actualValue: 80 })).toBe(80);
    });

    it('over-achievement capped at 150', () => {
      expect(computeScore({ uomType: 'NUMERIC_MIN', targetValue: 100, actualValue: 200 })).toBe(150);
    });

    it('returns null when target is 0', () => {
      expect(computeScore({ uomType: 'NUMERIC_MIN', targetValue: 0, actualValue: 50 })).toBeNull();
    });

    it('returns null when target is missing', () => {
      expect(computeScore({ uomType: 'NUMERIC_MIN', targetValue: null, actualValue: 50 })).toBeNull();
    });

    it('returns null when actual is missing', () => {
      expect(computeScore({ uomType: 'NUMERIC_MIN', targetValue: 100, actualValue: null })).toBeNull();
    });

    it('exact match = 100', () => {
      expect(computeScore({ uomType: 'NUMERIC_MIN', targetValue: 50, actualValue: 50 })).toBe(100);
    });
  });

  // ─── NUMERIC_MAX (lower is better) ───────────────────────────
  describe('NUMERIC_MAX', () => {
    it('normal: target 10 / actual 20 = 50', () => {
      expect(computeScore({ uomType: 'NUMERIC_MAX', targetValue: 10, actualValue: 20 })).toBe(50);
    });

    it('over-achievement capped at 150', () => {
      expect(computeScore({ uomType: 'NUMERIC_MAX', targetValue: 30, actualValue: 10 })).toBe(150);
    });

    it('returns null when actual is 0', () => {
      expect(computeScore({ uomType: 'NUMERIC_MAX', targetValue: 10, actualValue: 0 })).toBeNull();
    });

    it('returns null when actual is missing', () => {
      expect(computeScore({ uomType: 'NUMERIC_MAX', targetValue: 10, actualValue: null })).toBeNull();
    });

    it('exact match = 100', () => {
      expect(computeScore({ uomType: 'NUMERIC_MAX', targetValue: 10, actualValue: 10 })).toBe(100);
    });
  });

  // ─── TIMELINE (date-based) ───────────────────────────────────
  describe('TIMELINE', () => {
    it('on time: actual <= target → 100', () => {
      expect(computeScore({
        uomType: 'TIMELINE',
        targetDate: new Date('2025-06-30'),
        actualDate: new Date('2025-06-30'),
      })).toBe(100);
    });

    it('early completion → 100', () => {
      expect(computeScore({
        uomType: 'TIMELINE',
        targetDate: new Date('2025-06-30'),
        actualDate: new Date('2025-06-15'),
      })).toBe(100);
    });

    it('5 days late → 90', () => {
      expect(computeScore({
        uomType: 'TIMELINE',
        targetDate: new Date('2025-06-30'),
        actualDate: new Date('2025-07-05'),
      })).toBe(90);
    });

    it('55+ days late floors at 0', () => {
      expect(computeScore({
        uomType: 'TIMELINE',
        targetDate: new Date('2025-06-30'),
        actualDate: new Date('2025-09-30'),
      })).toBe(0);
    });

    it('returns null if targetDate is missing', () => {
      expect(computeScore({
        uomType: 'TIMELINE',
        targetDate: null,
        actualDate: new Date('2025-07-01'),
      })).toBeNull();
    });

    it('returns null if actualDate is missing', () => {
      expect(computeScore({
        uomType: 'TIMELINE',
        targetDate: new Date('2025-06-30'),
        actualDate: null,
      })).toBeNull();
    });
  });

  // ─── ZERO (zero = success) ───────────────────────────────────
  describe('ZERO', () => {
    it('actual=0 → 100', () => {
      expect(computeScore({ uomType: 'ZERO', actualValue: 0 })).toBe(100);
    });

    it('actual=3 → 0', () => {
      expect(computeScore({ uomType: 'ZERO', actualValue: 3 })).toBe(0);
    });

    it('actual=null → null', () => {
      expect(computeScore({ uomType: 'ZERO', actualValue: null })).toBeNull();
    });

    it('actual=undefined → null', () => {
      expect(computeScore({ uomType: 'ZERO', actualValue: undefined })).toBeNull();
    });
  });
});

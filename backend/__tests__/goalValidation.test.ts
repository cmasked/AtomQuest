import { validateGoalSheet } from '../src/utils/goalValidation';

describe('validateGoalSheet', () => {
  it('should return valid for exactly 100% total weightage', () => {
    const goals = [
      { weightage: 25 },
      { weightage: 25 },
      { weightage: 25 },
      { weightage: 25 },
    ];
    const result = validateGoalSheet(goals);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid for 99% total weightage', () => {
    const goals = [
      { weightage: 25 },
      { weightage: 25 },
      { weightage: 25 },
      { weightage: 24 },
    ];
    const result = validateGoalSheet(goals);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('99');
  });

  it('should return invalid when one goal has weightage below 10%', () => {
    const goals = [
      { weightage: 9 },
      { weightage: 31 },
      { weightage: 30 },
      { weightage: 30 },
    ];
    const result = validateGoalSheet(goals);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('9%');
    expect(result.error).toContain('Minimum');
  });

  it('should return invalid when there are more than 8 goals', () => {
    const goals = Array.from({ length: 9 }, () => ({ weightage: 11.11 }));
    const result = validateGoalSheet(goals);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('9');
    expect(result.error).toContain('Maximum');
  });

  it('should return valid for a single goal at 100%', () => {
    const goals = [{ weightage: 100 }];
    const result = validateGoalSheet(goals);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should handle float tolerance (99.999 ≈ 100)', () => {
    const goals = [
      { weightage: 33.333 },
      { weightage: 33.333 },
      { weightage: 33.333 },
    ];
    // Total = 99.999, which is within ±0.01 of 100
    const result = validateGoalSheet(goals);
    expect(result.valid).toBe(true);
  });

  it('should return invalid for empty goals array trying to sum to 100', () => {
    const result = validateGoalSheet([]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('0');
  });
});

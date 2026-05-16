export interface ScoreParams {
  uomType: 'NUMERIC_MIN' | 'NUMERIC_MAX' | 'TIMELINE' | 'ZERO';
  targetValue?: number | null;
  actualValue?: number | null;
  targetDate?: Date | null;
  actualDate?: Date | null;
}

/**
 * Computes the achievement score based on UoM type.
 *
 * NUMERIC_MIN (higher is better): score = (actual / target) * 100, cap 150
 * NUMERIC_MAX (lower is better):  score = (target / actual) * 100, cap 150
 * TIMELINE (date-based):          on-time = 100, late = 100 - (daysLate * 2), floor 0
 * ZERO (zero = success):          actual=0 → 100, else 0
 */
export function computeScore(params: ScoreParams): number | null {
  const { uomType, targetValue, actualValue, targetDate, actualDate } = params;

  switch (uomType) {
    case 'NUMERIC_MIN': {
      if (targetValue == null || targetValue === 0) return null;
      if (actualValue == null) return null;
      const score = (actualValue / targetValue) * 100;
      return Math.min(score, 150);
    }

    case 'NUMERIC_MAX': {
      if (actualValue == null || actualValue === 0) return null;
      if (targetValue == null) return null;
      const score = (targetValue / actualValue) * 100;
      return Math.min(score, 150);
    }

    case 'TIMELINE': {
      if (targetDate == null || actualDate == null) return null;
      const target = new Date(targetDate).getTime();
      const actual = new Date(actualDate).getTime();
      if (actual <= target) return 100;
      const daysLate = Math.ceil((actual - target) / (1000 * 60 * 60 * 24));
      return Math.max(0, 100 - daysLate * 2);
    }

    case 'ZERO': {
      if (actualValue == null) return null;
      return actualValue === 0 ? 100 : 0;
    }

    default:
      return null;
  }
}

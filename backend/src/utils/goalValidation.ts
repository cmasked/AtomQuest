export interface GoalWeightageInput {
  weightage: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a goal sheet according to business rules:
 * 1. Total weightage of all goals must equal exactly 100 (allow ±0.01 float tolerance)
 * 2. No single goal can have weightage below 10
 * 3. Total number of goals cannot exceed 8
 */
export function validateGoalSheet(goals: GoalWeightageInput[], isSubmit: boolean = false): ValidationResult {
  // Rule 3: Total number of goals cannot exceed 8
  if (goals.length > 8) {
    return {
      valid: false,
      error: `Too many goals: ${goals.length}. Maximum allowed is 8.`,
    };
  }

  // Rule 2: No single goal can have weightage below 10
  for (let i = 0; i < goals.length; i++) {
    if (goals[i].weightage < 10) {
      return {
        valid: false,
        error: `Goal ${i + 1} has weightage ${goals[i].weightage}%. Minimum allowed is 10%.`,
      };
    }
  }

  // Rule 1: Total weightage checks
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  
  if (isSubmit) {
    if (Math.abs(totalWeightage - 100) > 0.01) {
      return {
        valid: false,
        error: `Total weightage is ${totalWeightage}%. It must equal exactly 100%.`,
      };
    }
  } else {
    if (totalWeightage > 100.01) {
      return {
        valid: false,
        error: `Total weightage is ${totalWeightage}%. It cannot exceed 100%.`,
      };
    }
  }

  return { valid: true };
}

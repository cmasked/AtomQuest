import prisma from '../utils/prisma';
import { Quarter, GoalStatus, CyclePhase } from '@prisma/client';
import { computeScore } from '../utils/scoreEngine';

// Phase ordering for quarter access check
const PHASE_ORDER: Record<string, number> = {
  GOAL_SETTING: 0,
  Q1: 1,
  Q2: 2,
  Q3: 3,
  Q4: 4,
};

const QUARTER_MIN_PHASE: Record<string, number> = {
  Q1: 1,  // needs Q1+
  Q2: 2,  // needs Q2+
  Q3: 3,  // needs Q3+
  Q4: 4,  // needs Q4+
};

/**
 * Update or create an achievement record for a goal in a given quarter.
 */
export async function upsertAchievement(
  goalId: string,
  quarter: string,
  employeeId: string,
  data: {
    actualValue?: number | null;
    actualDate?: string | null;
    progressStatus: 'NOT_STARTED' | 'ON_TRACK' | 'COMPLETED';
  }
) {
  // Validate quarter
  if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
    throw { status: 400, message: `Invalid quarter: ${quarter}. Must be Q1, Q2, Q3, or Q4.` };
  }

  // Find the goal
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { cycle: true, recipients: true },
  });

  if (!goal) {
    throw { status: 404, message: 'Goal not found' };
  }

  if (goal.employeeId !== employeeId) {
    throw { status: 403, message: 'You can only log achievements for your own goals' };
  }

  if (goal.status !== GoalStatus.APPROVED) {
    throw { status: 400, message: 'Cannot log achievement against an unapproved goal. Goal must be APPROVED.' };
  }

  // Check cycle phase allows this quarter
  const cyclePhaseOrder = PHASE_ORDER[goal.cycle.phase] ?? 0;
  const requiredPhaseOrder = QUARTER_MIN_PHASE[quarter];

  if (cyclePhaseOrder < requiredPhaseOrder) {
    throw {
      status: 400,
      message: `Cannot update ${quarter} achievement. Cycle is currently in ${goal.cycle.phase} phase.`,
    };
  }

  // Compute score
  const score = computeScore({
    uomType: goal.uomType as any,
    targetValue: goal.targetValue,
    actualValue: data.actualValue,
    targetDate: goal.targetDate,
    actualDate: data.actualDate ? new Date(data.actualDate) : null,
  });

  // Upsert achievement
  const existing = await prisma.goalAchievement.findFirst({
    where: { goalId, quarter: quarter as Quarter },
  });

  let achievement;
  if (existing) {
    achievement = await prisma.goalAchievement.update({
      where: { id: existing.id },
      data: {
        actualValue: data.actualValue ?? null,
        actualDate: data.actualDate ? new Date(data.actualDate) : null,
        progressStatus: data.progressStatus,
        computedScore: score,
      },
    });
  } else {
    achievement = await prisma.goalAchievement.create({
      data: {
        goalId,
        quarter: quarter as Quarter,
        actualValue: data.actualValue ?? null,
        actualDate: data.actualDate ? new Date(data.actualDate) : null,
        progressStatus: data.progressStatus,
        computedScore: score,
      },
    });
  }

  // Propagate to shared goal recipients if this is a shared parent goal
  if (goal.isShared && goal.recipients.length > 0) {
    const childGoals = await prisma.goal.findMany({
      where: { parentGoalId: goalId },
      select: { id: true },
    });

    for (const child of childGoals) {
      const existingChild = await prisma.goalAchievement.findFirst({
        where: { goalId: child.id, quarter: quarter as Quarter },
      });

      if (existingChild) {
        await prisma.goalAchievement.update({
          where: { id: existingChild.id },
          data: {
            actualValue: data.actualValue ?? null,
            computedScore: score,
            progressStatus: data.progressStatus,
          },
        });
      } else {
        await prisma.goalAchievement.create({
          data: {
            goalId: child.id,
            quarter: quarter as Quarter,
            actualValue: data.actualValue ?? null,
            actualDate: data.actualDate ? new Date(data.actualDate) : null,
            progressStatus: data.progressStatus,
            computedScore: score,
          },
        });
      }
    }
  }

  return achievement;
}

/**
 * Get all achievements for a specific goal.
 */
export async function getGoalAchievements(goalId: string, userId: string, userRole: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { employee: { select: { managerId: true } } },
  });

  if (!goal) {
    throw { status: 404, message: 'Goal not found' };
  }

  // EMPLOYEE can view own goals, MANAGER can view team goals
  if (userRole === 'EMPLOYEE' && goal.employeeId !== userId) {
    throw { status: 403, message: 'You can only view achievements for your own goals' };
  }
  if (userRole === 'MANAGER' && goal.employee.managerId !== userId && goal.employeeId !== userId) {
    throw { status: 403, message: 'You can only view achievements for your team goals' };
  }

  const achievements = await prisma.goalAchievement.findMany({
    where: { goalId },
    orderBy: { quarter: 'asc' },
  });

  return achievements;
}

/**
 * Get achievement summary for all approved goals of an employee in the active cycle.
 */
export async function getMyAchievementSummary(employeeId: string) {
  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });

  if (!activeCycle) {
    return [];
  }

  const goals = await prisma.goal.findMany({
    where: {
      employeeId,
      cycleId: activeCycle.id,
      status: GoalStatus.APPROVED,
    },
    include: {
      achievements: {
        orderBy: { quarter: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return goals.map((g) => ({
    goalId: g.id,
    title: g.title,
    weightage: g.weightage,
    uomType: g.uomType,
    targetValue: g.targetValue,
    achievements: g.achievements.map((a) => ({
      quarter: a.quarter,
      actualValue: a.actualValue,
      computedScore: a.computedScore,
      progressStatus: a.progressStatus,
    })),
  }));
}

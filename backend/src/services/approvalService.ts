import prisma from '../utils/prisma';
import { GoalStatus, Quarter } from '@prisma/client';
import { validateGoalSheet } from '../utils/goalValidation';

/**
 * Submit a goal for approval (EMPLOYEE)
 * Goal must be in DRAFT or RETURNED status
 * All goals in the cycle must pass validation together
 */
export async function submitGoal(goalId: string, employeeId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw { status: 404, message: 'Goal not found' };
  }

  if (goal.employeeId !== employeeId) {
    throw { status: 403, message: 'You can only submit your own goals' };
  }

  if (goal.status !== GoalStatus.DRAFT && goal.status !== GoalStatus.RETURNED) {
    throw {
      status: 400,
      message: `Cannot submit a goal with status ${goal.status}. Goal must be in DRAFT or RETURNED status.`,
    };
  }

  // Fetch ALL goals by this employee in this cycle and validate together
  const allGoals = await prisma.goal.findMany({
    where: { employeeId, cycleId: goal.cycleId },
    select: { weightage: true },
  });

  const validation = validateGoalSheet(allGoals.map((g) => ({ weightage: g.weightage })));
  if (!validation.valid) {
    throw { status: 400, message: `Cannot submit: ${validation.error}` };
  }

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: { status: GoalStatus.SUBMITTED },
  });

  return updated;
}

/**
 * Approve a goal (MANAGER)
 * Goal must belong to a direct report and be in SUBMITTED status
 */
export async function approveGoal(goalId: string, managerId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      employee: { select: { managerId: true } },
    },
  });

  if (!goal) {
    throw { status: 404, message: 'Goal not found' };
  }

  // Must belong to a direct report
  if (goal.employee.managerId !== managerId) {
    throw { status: 403, message: 'This goal does not belong to your direct report' };
  }

  if (goal.status !== GoalStatus.SUBMITTED) {
    throw {
      status: 400,
      message: `Cannot approve a goal with status ${goal.status}. Goal must be in SUBMITTED status.`,
    };
  }

  const lockedAt = new Date();

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: {
      status: GoalStatus.APPROVED,
      lockedAt,
    },
  });

  // Write to AuditLog
  await prisma.auditLog.create({
    data: {
      entityType: 'Goal',
      entityId: goalId,
      changedBy: managerId,
      oldValue: { status: 'SUBMITTED' },
      newValue: { status: 'APPROVED', lockedAt: lockedAt.toISOString() },
    },
  });

  return updated;
}

/**
 * Return a goal to the employee (MANAGER)
 * Goal must belong to a direct report and be in SUBMITTED status
 */
export async function returnGoal(
  goalId: string,
  managerId: string,
  managerNote?: string
) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      employee: { select: { managerId: true } },
    },
  });

  if (!goal) {
    throw { status: 404, message: 'Goal not found' };
  }

  // Must belong to a direct report
  if (goal.employee.managerId !== managerId) {
    throw { status: 403, message: 'This goal does not belong to your direct report' };
  }

  if (goal.status !== GoalStatus.SUBMITTED) {
    throw {
      status: 400,
      message: `Cannot return a goal with status ${goal.status}. Goal must be in SUBMITTED status.`,
    };
  }

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: { status: GoalStatus.RETURNED },
  });

  // Save manager note as CheckinComment if provided
  if (managerNote) {
    await prisma.checkinComment.create({
      data: {
        goalId,
        managerId,
        quarter: Quarter.Q1, // Default to Q1 during goal setting phase
        comment: managerNote,
      },
    });
  }

  return updated;
}

/**
 * Admin unlock a goal
 * Sets lockedAt to null, status to DRAFT
 * Writes to AuditLog
 */
export async function adminUnlockGoal(goalId: string, adminId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw { status: 404, message: 'Goal not found' };
  }

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: {
      lockedAt: null,
      status: GoalStatus.DRAFT,
    },
  });

  // Write to AuditLog
  await prisma.auditLog.create({
    data: {
      entityType: 'Goal',
      entityId: goalId,
      changedBy: adminId,
      oldValue: { status: goal.status, lockedAt: goal.lockedAt?.toISOString() ?? null },
      newValue: { status: 'DRAFT', lockedAt: null },
    },
  });

  return updated;
}

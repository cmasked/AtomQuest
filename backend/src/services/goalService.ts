import prisma from '../utils/prisma';
import { GoalStatus } from '@prisma/client';
import { validateGoalSheet } from '../utils/goalValidation';

/**
 * Create a new goal for an employee in an active cycle
 */
export async function createGoal(
  employeeId: string,
  data: {
    cycleId: string;
    thrustArea: string;
    title: string;
    description: string;
    uomType: 'NUMERIC_MIN' | 'NUMERIC_MAX' | 'TIMELINE' | 'ZERO';
    targetValue?: number;
    targetDate?: string;
    weightage: number;
  }
) {
  // Check that the GoalCycle exists and is currently open
  const cycle = await prisma.goalCycle.findUnique({
    where: { id: data.cycleId },
  });

  if (!cycle) {
    throw { status: 404, message: 'Goal cycle not found' };
  }

  const now = new Date();
  if (now < cycle.opensAt || now > cycle.closesAt) {
    throw { status: 400, message: 'Goal cycle is not currently open for submissions' };
  }

  // Fetch existing goals for this employee in this cycle
  const existingGoals = await prisma.goal.findMany({
    where: { employeeId, cycleId: data.cycleId },
    select: { weightage: true },
  });

  // Validate goal sheet with the new goal included
  const allGoals = [
    ...existingGoals.map((g) => ({ weightage: g.weightage })),
    { weightage: data.weightage },
  ];

  const validation = validateGoalSheet(allGoals);
  if (!validation.valid) {
    throw { status: 400, message: validation.error };
  }

  // Create the goal with DRAFT status
  const goal = await prisma.goal.create({
    data: {
      employeeId,
      cycleId: data.cycleId,
      thrustArea: data.thrustArea,
      title: data.title,
      description: data.description,
      uomType: data.uomType,
      targetValue: data.targetValue ?? null,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      weightage: data.weightage,
      status: GoalStatus.DRAFT,
    },
  });

  return goal;
}

/**
 * Get all goals for an employee in the active cycle, with achievements
 */
export async function getMyGoals(employeeId: string) {
  // Find active cycle
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
    },
    include: {
      achievements: true,
      cycle: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return goals;
}

/**
 * Get all goals for a manager's direct reports, grouped by employee
 */
export async function getTeamGoals(managerId: string) {
  // Find direct reports
  const reports = await prisma.user.findMany({
    where: { managerId },
    select: { id: true, name: true, email: true, department: true },
  });

  // Find active cycle
  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });

  if (!activeCycle) {
    return reports.map((r) => ({ ...r, goals: [] }));
  }

  // Fetch goals for all reports
  const reportIds = reports.map((r) => r.id);
  const goals = await prisma.goal.findMany({
    where: {
      employeeId: { in: reportIds },
      cycleId: activeCycle.id,
    },
    include: {
      achievements: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by employee
  const grouped = reports.map((report) => ({
    ...report,
    goals: goals.filter((g) => g.employeeId === report.id),
  }));

  return grouped;
}

/**
 * Update a goal (PATCH)
 */
export async function updateGoal(
  goalId: string,
  userId: string,
  userRole: string,
  data: Partial<{
    thrustArea: string;
    title: string;
    description: string;
    uomType: 'NUMERIC_MIN' | 'NUMERIC_MAX' | 'TIMELINE' | 'ZERO';
    targetValue: number;
    targetDate: string;
    weightage: number;
  }>
) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw { status: 404, message: 'Goal not found' };
  }

  // If goal is locked and user is not ADMIN → 403
  if (goal.lockedAt && userRole !== 'ADMIN') {
    throw { status: 403, message: 'Goal is locked' };
  }

  // If goal status is APPROVED → 403
  if (goal.status === GoalStatus.APPROVED) {
    throw { status: 403, message: 'Goal is locked' };
  }

  // Check ownership: EMPLOYEE can edit own goals, MANAGER can edit team goals
  if (userRole === 'EMPLOYEE' && goal.employeeId !== userId) {
    throw { status: 403, message: 'You can only edit your own goals' };
  }

  if (userRole === 'MANAGER') {
    // Check that the goal belongs to a direct report
    const goalOwner = await prisma.user.findUnique({
      where: { id: goal.employeeId },
      select: { managerId: true },
    });
    if (goalOwner?.managerId !== userId && goal.employeeId !== userId) {
      throw { status: 403, message: 'You can only edit goals for your direct reports' };
    }
  }

  // If weightage is being updated, validate the full sheet
  if (data.weightage !== undefined) {
    const existingGoals = await prisma.goal.findMany({
      where: { employeeId: goal.employeeId, cycleId: goal.cycleId },
      select: { id: true, weightage: true },
    });

    const allGoals = existingGoals.map((g) => ({
      weightage: g.id === goalId ? data.weightage! : g.weightage,
    }));

    const validation = validateGoalSheet(allGoals);
    if (!validation.valid) {
      throw { status: 400, message: validation.error };
    }
  }

  // Write to AuditLog if goal was previously locked
  if (goal.lockedAt) {
    await prisma.auditLog.create({
      data: {
        entityType: 'Goal',
        entityId: goalId,
        changedBy: userId,
        oldValue: { lockedAt: goal.lockedAt, status: goal.status },
        newValue: data,
      },
    });
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (data.thrustArea !== undefined) updateData.thrustArea = data.thrustArea;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.uomType !== undefined) updateData.uomType = data.uomType;
  if (data.targetValue !== undefined) updateData.targetValue = data.targetValue;
  if (data.targetDate !== undefined) updateData.targetDate = new Date(data.targetDate);
  if (data.weightage !== undefined) updateData.weightage = data.weightage;

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: updateData,
  });

  return updated;
}

/**
 * Delete a goal (only own DRAFT goals)
 */
export async function deleteGoal(goalId: string, userId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw { status: 404, message: 'Goal not found' };
  }

  if (goal.employeeId !== userId) {
    throw { status: 403, message: 'You can only delete your own goals' };
  }

  if (goal.status !== GoalStatus.DRAFT) {
    throw { status: 400, message: `Cannot delete a goal with status ${goal.status}. Only DRAFT goals can be deleted.` };
  }

  await prisma.goal.delete({ where: { id: goalId } });

  return { message: 'Goal deleted successfully' };
}

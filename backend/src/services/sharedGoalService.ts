import prisma from '../utils/prisma';
import { GoalStatus } from '@prisma/client';
import { validateGoalSheet } from '../utils/goalValidation';

/**
 * Create a shared goal from admin/manager and distribute to recipients.
 */
export async function createSharedGoal(
  creatorId: string,
  data: {
    cycleId: string;
    thrustArea: string;
    title: string;
    description: string;
    uomType: 'NUMERIC_MIN' | 'NUMERIC_MAX' | 'TIMELINE' | 'ZERO';
    targetValue?: number;
    targetDate?: string;
    recipientIds: string[];
    weightagePerRecipient: number;
  }
) {
  if (data.weightagePerRecipient < 10) {
    throw { status: 400, message: 'Weightage per recipient must be at least 10%' };
  }

  if (!data.recipientIds || data.recipientIds.length === 0) {
    throw { status: 400, message: 'At least one recipient is required' };
  }

  // Check cycle exists
  const cycle = await prisma.goalCycle.findUnique({ where: { id: data.cycleId } });
  if (!cycle) {
    throw { status: 404, message: 'Goal cycle not found' };
  }

  // Validate each recipient
  for (const recipientId of data.recipientIds) {
    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
      throw { status: 404, message: `Recipient not found: ${recipientId}` };
    }

    // Check goal count and weightage limits for recipient
    const existingGoals = await prisma.goal.findMany({
      where: { employeeId: recipientId, cycleId: data.cycleId },
      select: { weightage: true },
    });

    // Check goal count limit (max 8)
    if (existingGoals.length >= 8) {
      throw {
        status: 400,
        message: `Recipient ${recipient.name} already has ${existingGoals.length} goals (max 8)`,
      };
    }

    // Check total weightage
    const currentTotal = existingGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (currentTotal + data.weightagePerRecipient > 100.01) {
      throw {
        status: 400,
        message: `Adding ${data.weightagePerRecipient}% to ${recipient.name} would exceed 100% (current: ${currentTotal}%)`,
      };
    }
  }

  const now = new Date();

  // Create parent goal
  const parentGoal = await prisma.goal.create({
    data: {
      employeeId: creatorId,
      cycleId: data.cycleId,
      thrustArea: data.thrustArea,
      title: data.title,
      description: data.description,
      uomType: data.uomType,
      targetValue: data.targetValue ?? null,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      weightage: 0, // Parent goal's weightage isn't meaningful
      isShared: true,
      status: GoalStatus.APPROVED,
      lockedAt: now,
    },
  });

  // Create SharedGoalRecipient rows and child goals
  const recipients = [];
  for (const recipientId of data.recipientIds) {
    // Create SharedGoalRecipient
    const sgr = await prisma.sharedGoalRecipient.create({
      data: {
        parentGoalId: parentGoal.id,
        recipientId,
        customWeightage: data.weightagePerRecipient,
      },
    });

    // Create child goal for recipient
    await prisma.goal.create({
      data: {
        employeeId: recipientId,
        cycleId: data.cycleId,
        thrustArea: data.thrustArea,
        title: data.title,
        description: data.description,
        uomType: data.uomType,
        targetValue: data.targetValue ?? null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        weightage: data.weightagePerRecipient,
        isShared: true,
        parentGoalId: parentGoal.id,
        status: GoalStatus.APPROVED,
        lockedAt: now,
      },
    });

    recipients.push(sgr);
  }

  return {
    parentGoal,
    recipients,
  };
}

/**
 * Update weightage on a recipient's copy of a shared goal.
 */
export async function updateSharedGoalWeightage(
  goalId: string,
  employeeId: string,
  data: { weightage: number; [key: string]: any }
) {
  // Reject if read-only fields are included
  const readOnlyFields = ['title', 'description', 'targetValue', 'uomType', 'targetDate', 'thrustArea'];
  for (const field of readOnlyFields) {
    if (data[field] !== undefined) {
      throw { status: 400, message: `Cannot modify '${field}' on a shared goal. Only weightage can be changed.` };
    }
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });

  if (!goal) {
    throw { status: 404, message: 'Goal not found' };
  }

  if (goal.employeeId !== employeeId) {
    throw { status: 403, message: 'You can only modify your own goals' };
  }

  if (!goal.parentGoalId) {
    throw { status: 400, message: 'This is not a shared goal copy. Use the regular update endpoint.' };
  }

  // Validate full goal sheet after change
  const existingGoals = await prisma.goal.findMany({
    where: { employeeId, cycleId: goal.cycleId },
    select: { id: true, weightage: true },
  });

  const allGoals = existingGoals.map((g) => ({
    weightage: g.id === goalId ? data.weightage : g.weightage,
  }));

  const validation = validateGoalSheet(allGoals);
  if (!validation.valid) {
    throw { status: 400, message: validation.error };
  }

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: { weightage: data.weightage },
  });

  return updated;
}

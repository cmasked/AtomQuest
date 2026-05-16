import prisma from '../utils/prisma';
import { Quarter } from '@prisma/client';

/**
 * Create or update a check-in comment from a manager for a goal/quarter.
 */
export async function upsertCheckin(
  managerId: string,
  data: { goalId: string; quarter: string; comment: string }
) {
  if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(data.quarter)) {
    throw { status: 400, message: `Invalid quarter: ${data.quarter}` };
  }

  // Verify goal exists and belongs to a direct report
  const goal = await prisma.goal.findUnique({
    where: { id: data.goalId },
    include: { employee: { select: { id: true, managerId: true, name: true } } },
  });

  if (!goal) {
    throw { status: 404, message: 'Goal not found' };
  }

  if (goal.employee.managerId !== managerId) {
    throw { status: 403, message: 'This goal does not belong to your direct report' };
  }

  // Upsert: find existing by goalId + managerId + quarter
  const existing = await prisma.checkinComment.findFirst({
    where: {
      goalId: data.goalId,
      managerId,
      quarter: data.quarter as Quarter,
    },
  });

  if (existing) {
    const updated = await prisma.checkinComment.update({
      where: { id: existing.id },
      data: { comment: data.comment },
    });
    return updated;
  }

  const created = await prisma.checkinComment.create({
    data: {
      goalId: data.goalId,
      managerId,
      quarter: data.quarter as Quarter,
      comment: data.comment,
    },
  });
  return created;
}

/**
 * Get all check-in comments by a manager, grouped by employee then quarter.
 */
export async function getTeamCheckins(managerId: string) {
  const comments = await prisma.checkinComment.findMany({
    where: { managerId },
    include: {
      goal: {
        select: {
          id: true,
          title: true,
          employee: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by employee, then by quarter
  const grouped: Record<string, {
    employeeId: string;
    employeeName: string;
    quarters: Record<string, Array<{
      goalId: string;
      goalTitle: string;
      comment: string;
      createdAt: Date;
    }>>;
  }> = {};

  for (const c of comments) {
    const empId = c.goal.employee.id;
    if (!grouped[empId]) {
      grouped[empId] = {
        employeeId: empId,
        employeeName: c.goal.employee.name,
        quarters: {},
      };
    }
    if (!grouped[empId].quarters[c.quarter]) {
      grouped[empId].quarters[c.quarter] = [];
    }
    grouped[empId].quarters[c.quarter].push({
      goalId: c.goal.id,
      goalTitle: c.goal.title,
      comment: c.comment,
      createdAt: c.createdAt,
    });
  }

  return Object.values(grouped);
}

/**
 * Get all check-in comments for a specific goal across all quarters.
 */
export async function getGoalCheckins(goalId: string, userId: string, userRole: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { employee: { select: { id: true, managerId: true } } },
  });

  if (!goal) {
    throw { status: 404, message: 'Goal not found' };
  }

  // EMPLOYEE can view own goal's checkins, MANAGER can view team
  if (userRole === 'EMPLOYEE' && goal.employeeId !== userId) {
    throw { status: 403, message: 'You can only view check-ins for your own goals' };
  }
  if (userRole === 'MANAGER' && goal.employee.managerId !== userId && goal.employeeId !== userId) {
    throw { status: 403, message: 'You can only view check-ins for your team goals' };
  }

  const comments = await prisma.checkinComment.findMany({
    where: { goalId },
    include: {
      manager: { select: { id: true, name: true } },
    },
    orderBy: [{ quarter: 'asc' }, { createdAt: 'desc' }],
  });

  return comments;
}

/**
 * Admin: Get completion report for a quarter.
 */
export async function getCheckinCompletion(quarter: string) {
  if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
    throw { status: 400, message: `Invalid quarter: ${quarter}` };
  }

  // Get all managers with their reports
  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER', isActive: true },
    select: {
      id: true,
      name: true,
      reports: {
        where: { isActive: true },
        select: { id: true, name: true },
      },
    },
  });

  const result = [];

  for (const mgr of managers) {
    if (mgr.reports.length === 0) continue;

    // Get all checkin comments by this manager for this quarter
    const checkins = await prisma.checkinComment.findMany({
      where: {
        managerId: mgr.id,
        quarter: quarter as Quarter,
      },
      select: {
        goal: { select: { employeeId: true } },
      },
    });

    // Unique employees who have at least one checkin
    const completedEmployeeIds = new Set(checkins.map((c) => c.goal.employeeId));

    const pendingEmployees = mgr.reports.filter((r) => !completedEmployeeIds.has(r.id));

    result.push({
      managerId: mgr.id,
      managerName: mgr.name,
      totalReports: mgr.reports.length,
      checkinsCompleted: completedEmployeeIds.size,
      completionRate: Math.round((completedEmployeeIds.size / mgr.reports.length) * 100),
      pendingEmployees,
    });
  }

  return result;
}

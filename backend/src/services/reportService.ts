import prisma from '../utils/prisma';
import { Quarter, GoalStatus } from '@prisma/client';

/**
 * Get flat achievement report with optional filters.
 * MANAGER sees only direct reports, ADMIN sees all.
 */
export async function getAchievementReport(
  userId: string,
  userRole: string,
  filters: { cycleId?: string; quarter?: string; departmentId?: string }
) {
  // Determine which employees to include
  let employeeFilter: any = {};

  if (userRole === 'MANAGER') {
    employeeFilter = { managerId: userId };
  }
  // ADMIN sees all (no employee filter)

  if (filters.departmentId) {
    employeeFilter.department = filters.departmentId;
  }

  employeeFilter.isActive = true;

  const employees = await prisma.user.findMany({
    where: employeeFilter,
    select: { id: true, name: true, department: true },
  });

  const employeeIds = employees.map((e) => e.id);
  if (employeeIds.length === 0) return [];

  // Build goal filter
  const goalWhere: any = {
    employeeId: { in: employeeIds },
    status: GoalStatus.APPROVED,
  };

  if (filters.cycleId) {
    goalWhere.cycleId = filters.cycleId;
  } else {
    // Default to active cycle
    const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
    if (activeCycle) goalWhere.cycleId = activeCycle.id;
  }

  const goals = await prisma.goal.findMany({
    where: goalWhere,
    include: {
      achievements: filters.quarter
        ? { where: { quarter: filters.quarter as Quarter } }
        : true,
      employee: { select: { name: true, department: true } },
    },
  });

  // Flatten into report rows
  const rows: any[] = [];
  for (const goal of goals) {
    if (goal.achievements.length === 0) {
      // Include goal even without achievements
      rows.push({
        employeeId: goal.employeeId,
        employeeName: goal.employee.name,
        department: goal.employee.department,
        goalId: goal.id,
        goalTitle: goal.title,
        thrustArea: goal.thrustArea,
        uomType: goal.uomType,
        targetValue: goal.targetValue,
        weightage: goal.weightage,
        quarter: filters.quarter || null,
        actualValue: null,
        computedScore: null,
        progressStatus: null,
      });
    } else {
      for (const ach of goal.achievements) {
        rows.push({
          employeeId: goal.employeeId,
          employeeName: goal.employee.name,
          department: goal.employee.department,
          goalId: goal.id,
          goalTitle: goal.title,
          thrustArea: goal.thrustArea,
          uomType: goal.uomType,
          targetValue: goal.targetValue,
          weightage: goal.weightage,
          quarter: ach.quarter,
          actualValue: ach.actualValue,
          computedScore: ach.computedScore,
          progressStatus: ach.progressStatus,
        });
      }
    }
  }

  return rows;
}

/**
 * Get completion dashboard data for admin.
 */
export async function getCompletionDashboard() {
  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  if (!activeCycle) {
    throw { status: 404, message: 'No active cycle found' };
  }

  // Goal setting completion
  const allEmployees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', isActive: true },
    select: { id: true },
  });
  const totalEmployees = allEmployees.length;
  const employeeIds = allEmployees.map((e) => e.id);

  const goals = await prisma.goal.findMany({
    where: {
      cycleId: activeCycle.id,
      employeeId: { in: employeeIds },
    },
    select: { employeeId: true, status: true },
  });

  // Count unique employees by status
  const employeeStatuses: Record<string, Set<string>> = {
    DRAFT: new Set(),
    SUBMITTED: new Set(),
    APPROVED: new Set(),
    RETURNED: new Set(),
  };

  for (const g of goals) {
    employeeStatuses[g.status]?.add(g.employeeId);
  }

  const submitted = employeeStatuses.SUBMITTED.size;
  const approved = employeeStatuses.APPROVED.size;
  const draft = employeeStatuses.DRAFT.size;
  const returned = employeeStatuses.RETURNED.size;

  // Quarterly check-in completion
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
  const quarterlyCheckins: Record<string, any> = {};

  for (const q of quarters) {
    const checkins = await prisma.checkinComment.findMany({
      where: { quarter: q as Quarter },
      select: {
        goal: { select: { employeeId: true } },
      },
    });

    const completedEmployees = new Set(checkins.map((c) => c.goal.employeeId));

    quarterlyCheckins[q] = {
      totalExpected: totalEmployees,
      completed: completedEmployees.size,
      completionRate: totalEmployees > 0
        ? Math.round((completedEmployees.size / totalEmployees) * 100)
        : 0,
    };
  }

  return {
    cycleId: activeCycle.id,
    cycleName: activeCycle.name,
    phase: activeCycle.phase,
    goalSettingCompletion: {
      totalEmployees,
      submitted,
      approved,
      draft,
      returned,
      submissionRate: totalEmployees > 0
        ? Math.round(((submitted + approved) / totalEmployees) * 100)
        : 0,
      approvalRate: totalEmployees > 0
        ? Math.round((approved / totalEmployees) * 100)
        : 0,
    },
    quarterlyCheckins,
  };
}

/**
 * Get audit log entries for a given entity.
 */
export async function getAuditLog(entityId: string) {
  const logs = await prisma.auditLog.findMany({
    where: { entityId },
    include: {
      changedByUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { changedAt: 'desc' },
  });

  return logs;
}

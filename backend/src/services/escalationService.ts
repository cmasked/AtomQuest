import prisma from '../utils/prisma';
import { EscalationTrigger, EscalationStatus } from '@prisma/client';
import * as notificationService from './notificationService';

// ─── Escalation Rule CRUD ───────────────────────────────────────────────────

export async function createRule(data: {
  cycleId: string;
  trigger: string;
  thresholdDays: number;
}) {
  const rule = await prisma.escalationRule.create({
    data: {
      cycleId: data.cycleId,
      trigger: data.trigger as EscalationTrigger,
      thresholdDays: data.thresholdDays,
    },
    include: { cycle: { select: { name: true } } },
  });
  return rule;
}

export async function getRules(cycleId?: string) {
  const where: any = {};
  if (cycleId) where.cycleId = cycleId;
  return prisma.escalationRule.findMany({
    where,
    include: {
      cycle: { select: { name: true } },
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateRule(ruleId: string, data: { thresholdDays?: number; isActive?: boolean }) {
  return prisma.escalationRule.update({
    where: { id: ruleId },
    data,
  });
}

export async function deleteRule(ruleId: string) {
  await prisma.escalationLog.deleteMany({ where: { ruleId } });
  await prisma.escalationRule.delete({ where: { id: ruleId } });
  return { message: 'Rule deleted' };
}

// ─── Escalation Logs ────────────────────────────────────────────────────────

export async function getEscalationLogs(filters?: { ruleId?: string; status?: string }) {
  const where: any = {};
  if (filters?.ruleId) where.ruleId = filters.ruleId;
  if (filters?.status) where.status = filters.status;

  return prisma.escalationLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, department: true } },
      rule: { select: { trigger: true, thresholdDays: true, cycle: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function resolveEscalation(logId: string) {
  return prisma.escalationLog.update({
    where: { id: logId },
    data: { status: EscalationStatus.RESOLVED, resolvedAt: new Date() },
  });
}

// ─── Escalation Engine (cron-style checker) ─────────────────────────────────

/**
 * Run escalation checks for all active rules in the active cycle.
 * Call this on a schedule (e.g., daily cron job) or manually via admin endpoint.
 */
export async function runEscalationCheck() {
  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });
  if (!activeCycle) return { processed: 0, escalations: 0 };

  const rules = await prisma.escalationRule.findMany({
    where: { cycleId: activeCycle.id, isActive: true },
  });

  let totalEscalations = 0;

  for (const rule of rules) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rule.thresholdDays);

    if (rule.trigger === EscalationTrigger.GOAL_NOT_SUBMITTED) {
      totalEscalations += await checkGoalNotSubmitted(rule.id, activeCycle.id, cutoffDate);
    } else if (rule.trigger === EscalationTrigger.GOAL_NOT_APPROVED) {
      totalEscalations += await checkGoalNotApproved(rule.id, activeCycle.id, cutoffDate);
    } else if (rule.trigger === EscalationTrigger.CHECKIN_NOT_COMPLETED) {
      totalEscalations += await checkCheckinNotCompleted(rule.id, activeCycle);
    }
  }

  return { processed: rules.length, escalations: totalEscalations };
}

async function checkGoalNotSubmitted(ruleId: string, cycleId: string, cutoffDate: Date): Promise<number> {
  // Find employees who have goals in DRAFT status older than threshold
  const employees = await prisma.user.findMany({
    where: {
      role: 'EMPLOYEE',
      isActive: true,
      goals: {
        some: { cycleId, status: 'DRAFT', createdAt: { lt: cutoffDate } },
        none: { cycleId, status: { in: ['SUBMITTED', 'APPROVED'] } },
      },
    },
    select: { id: true, name: true, email: true, managerId: true },
  });

  let count = 0;
  for (const emp of employees) {
    // Check if already escalated recently (within 3 days)
    const recent = await prisma.escalationLog.findFirst({
      where: { ruleId, userId: emp.id, createdAt: { gt: new Date(Date.now() - 3 * 86400000) } },
    });
    if (recent) continue;

    // Determine escalation level
    const existing = await prisma.escalationLog.findMany({
      where: { ruleId, userId: emp.id, status: { not: EscalationStatus.RESOLVED } },
    });
    const level = Math.min((existing.length || 0) + 1, 3);

    const message = level === 1
      ? `${emp.name} has not submitted goals for the current cycle.`
      : level === 2
      ? `ESCALATION: ${emp.name}'s goals are still unsubmitted. Manager notified.`
      : `CRITICAL: ${emp.name}'s goals remain unsubmitted. HR/skip-level notified.`;

    await prisma.escalationLog.create({
      data: { ruleId, userId: emp.id, level, message, status: EscalationStatus.NOTIFIED },
    });

    // Send notification based on level
    await notificationService.notifyCheckinReminder(emp.id, 'Goal Setting');
    count++;
  }
  return count;
}

async function checkGoalNotApproved(ruleId: string, cycleId: string, cutoffDate: Date): Promise<number> {
  // Find goals submitted but not approved beyond threshold
  const goals = await prisma.goal.findMany({
    where: { cycleId, status: 'SUBMITTED', updatedAt: { lt: cutoffDate } },
    include: { employee: { select: { id: true, name: true, managerId: true, manager: { select: { id: true, name: true, email: true } } } } },
  });

  // Group by manager
  const managerMap = new Map<string, { managerId: string; employees: string[] }>();
  for (const goal of goals) {
    const mgr = goal.employee.manager;
    if (!mgr) continue;
    if (!managerMap.has(mgr.id)) {
      managerMap.set(mgr.id, { managerId: mgr.id, employees: [] });
    }
    if (!managerMap.get(mgr.id)!.employees.includes(goal.employee.name)) {
      managerMap.get(mgr.id)!.employees.push(goal.employee.name);
    }
  }

  let count = 0;
  for (const [managerId, info] of managerMap) {
    const recent = await prisma.escalationLog.findFirst({
      where: { ruleId, userId: managerId, createdAt: { gt: new Date(Date.now() - 3 * 86400000) } },
    });
    if (recent) continue;

    const message = `Manager has ${info.employees.length} employee(s) with pending goal approvals: ${info.employees.join(', ')}`;
    await prisma.escalationLog.create({
      data: { ruleId, userId: managerId, level: 2, message, status: EscalationStatus.NOTIFIED },
    });
    count++;
  }
  return count;
}

async function checkCheckinNotCompleted(ruleId: string, cycle: any): Promise<number> {
  const currentQuarter = cycle.phase;
  if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(currentQuarter)) return 0;

  // Find employees with approved goals who haven't entered achievements
  const employeesWithApproved = await prisma.user.findMany({
    where: {
      role: 'EMPLOYEE',
      isActive: true,
      goals: { some: { cycleId: cycle.id, status: 'APPROVED' } },
    },
    select: { id: true, name: true, email: true },
  });

  let count = 0;
  for (const emp of employeesWithApproved) {
    const achievements = await prisma.goalAchievement.findMany({
      where: {
        goal: { employeeId: emp.id, cycleId: cycle.id, status: 'APPROVED' },
        quarter: currentQuarter,
        actualValue: { not: null },
      },
    });

    if (achievements.length > 0) continue; // Has at least one entry

    const recent = await prisma.escalationLog.findFirst({
      where: { ruleId, userId: emp.id, createdAt: { gt: new Date(Date.now() - 3 * 86400000) } },
    });
    if (recent) continue;

    const message = `${emp.name} has not completed ${currentQuarter} achievement entries.`;
    await prisma.escalationLog.create({
      data: { ruleId, userId: emp.id, level: 1, message, status: EscalationStatus.NOTIFIED },
    });

    await notificationService.notifyCheckinReminder(emp.id, currentQuarter);
    count++;
  }
  return count;
}

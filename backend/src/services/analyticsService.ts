import prisma from '../utils/prisma';

/**
 * 5.4.1 — QoQ Achievement Trends
 * Returns average scores by quarter at individual, team, or department level
 */
export async function getQoQTrends(filters?: {
  employeeId?: string;
  managerId?: string;
  department?: string;
}) {
  const where: any = { goal: { status: 'APPROVED' } };

  if (filters?.employeeId) {
    where.goal = { ...where.goal, employeeId: filters.employeeId };
  } else if (filters?.managerId) {
    where.goal = { ...where.goal, employee: { managerId: filters.managerId } };
  } else if (filters?.department) {
    where.goal = { ...where.goal, employee: { department: filters.department } };
  }

  const achievements = await prisma.goalAchievement.findMany({
    where,
    select: {
      quarter: true,
      computedScore: true,
      progressStatus: true,
      goal: {
        select: {
          thrustArea: true,
          weightage: true,
          employee: { select: { name: true, department: true } },
        },
      },
    },
  });

  // Aggregate by quarter
  const quarterMap: Record<string, { totalScore: number; count: number; completed: number; onTrack: number; atRisk: number; notStarted: number }> = {};
  for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
    quarterMap[q] = { totalScore: 0, count: 0, completed: 0, onTrack: 0, atRisk: 0, notStarted: 0 };
  }

  for (const a of achievements) {
    const q = a.quarter;
    if (!quarterMap[q]) continue;
    if (a.computedScore !== null) {
      quarterMap[q].totalScore += a.computedScore;
      quarterMap[q].count++;
    }
    if (a.progressStatus === 'COMPLETED') quarterMap[q].completed++;
    else if (a.progressStatus === 'ON_TRACK') quarterMap[q].onTrack++;
    else if (a.progressStatus === 'AT_RISK') quarterMap[q].atRisk++;
    else quarterMap[q].notStarted++;
  }

  const trends = Object.entries(quarterMap).map(([quarter, data]) => ({
    quarter,
    avgScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 10) / 10 : null,
    totalGoals: data.count + data.notStarted,
    scored: data.count,
    completed: data.completed,
    onTrack: data.onTrack,
    atRisk: data.atRisk,
    notStarted: data.notStarted,
  }));

  return trends;
}

/**
 * 5.4.2 — Heatmap: Completion rates across departments x quarters
 */
export async function getCompletionHeatmap() {
  const users = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', isActive: true },
    select: {
      id: true,
      department: true,
      goals: {
        where: { status: 'APPROVED' },
        select: {
          id: true,
          achievements: {
            select: { quarter: true, computedScore: true, progressStatus: true },
          },
        },
      },
    },
  });

  // Build: department → quarter → { total, completed, avgScore }
  const heatmap: Record<string, Record<string, { total: number; completed: number; scored: number; totalScore: number }>> = {};

  for (const user of users) {
    const dept = user.department;
    if (!heatmap[dept]) heatmap[dept] = {};

    for (const goal of user.goals) {
      for (const ach of goal.achievements) {
        const q = ach.quarter;
        if (!heatmap[dept][q]) heatmap[dept][q] = { total: 0, completed: 0, scored: 0, totalScore: 0 };
        heatmap[dept][q].total++;
        if (ach.progressStatus === 'COMPLETED') heatmap[dept][q].completed++;
        if (ach.computedScore !== null) {
          heatmap[dept][q].scored++;
          heatmap[dept][q].totalScore += ach.computedScore;
        }
      }
    }
  }

  // Flatten to array
  const result: any[] = [];
  for (const [department, quarters] of Object.entries(heatmap)) {
    for (const [quarter, data] of Object.entries(quarters)) {
      result.push({
        department,
        quarter,
        totalGoals: data.total,
        completedGoals: data.completed,
        completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        avgScore: data.scored > 0 ? Math.round((data.totalScore / data.scored) * 10) / 10 : null,
      });
    }
  }

  return result;
}

/**
 * 5.4.3 — Goal Distribution Analysis
 * Breakdown by Thrust Area, UoM type, and status
 */
export async function getGoalDistribution() {
  const goals = await prisma.goal.findMany({
    where: { cycle: { isActive: true } },
    select: {
      thrustArea: true,
      uomType: true,
      status: true,
      weightage: true,
      employee: { select: { department: true } },
    },
  });

  // By Thrust Area
  const thrustAreaMap: Record<string, { count: number; totalWeightage: number; statuses: Record<string, number> }> = {};
  for (const g of goals) {
    if (!thrustAreaMap[g.thrustArea]) thrustAreaMap[g.thrustArea] = { count: 0, totalWeightage: 0, statuses: {} };
    thrustAreaMap[g.thrustArea].count++;
    thrustAreaMap[g.thrustArea].totalWeightage += g.weightage;
    thrustAreaMap[g.thrustArea].statuses[g.status] = (thrustAreaMap[g.thrustArea].statuses[g.status] || 0) + 1;
  }

  // By UoM Type
  const uomMap: Record<string, number> = {};
  for (const g of goals) {
    uomMap[g.uomType] = (uomMap[g.uomType] || 0) + 1;
  }

  // By Status
  const statusMap: Record<string, number> = {};
  for (const g of goals) {
    statusMap[g.status] = (statusMap[g.status] || 0) + 1;
  }

  // By Department
  const deptMap: Record<string, number> = {};
  for (const g of goals) {
    deptMap[g.employee.department] = (deptMap[g.employee.department] || 0) + 1;
  }

  return {
    byThrustArea: Object.entries(thrustAreaMap).map(([name, data]) => ({
      name,
      count: data.count,
      avgWeightage: Math.round((data.totalWeightage / data.count) * 10) / 10,
      statuses: data.statuses,
    })),
    byUomType: Object.entries(uomMap).map(([type, count]) => ({ type, count })),
    byStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    byDepartment: Object.entries(deptMap).map(([department, count]) => ({ department, count })),
    totalGoals: goals.length,
  };
}

/**
 * 5.4.4 — Manager Effectiveness Dashboard
 * Compare check-in completion rates across L1 managers
 */
export async function getManagerEffectiveness() {
  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER', isActive: true },
    select: {
      id: true,
      name: true,
      department: true,
      reports: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          goals: {
            where: { status: 'APPROVED', cycle: { isActive: true } },
            select: {
              id: true,
              achievements: {
                select: { quarter: true, computedScore: true, progressStatus: true },
              },
              comments: {
                select: { quarter: true },
              },
            },
          },
        },
      },
    },
  });

  return managers.map(mgr => {
    const teamSize = mgr.reports.length;
    let totalApprovedGoals = 0;
    let totalAchievements = 0;
    let totalCheckins = 0;
    let totalScore = 0;
    let scoredCount = 0;
    const quarterlyCheckins: Record<string, { total: number; completed: number }> = {};

    for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
      quarterlyCheckins[q] = { total: 0, completed: 0 };
    }

    for (const report of mgr.reports) {
      for (const goal of report.goals) {
        totalApprovedGoals++;
        for (const ach of goal.achievements) {
          totalAchievements++;
          if (ach.computedScore !== null) {
            totalScore += ach.computedScore;
            scoredCount++;
          }
          quarterlyCheckins[ach.quarter].total++;
          if (ach.progressStatus !== 'NOT_STARTED') {
            quarterlyCheckins[ach.quarter].completed++;
          }
        }
        totalCheckins += goal.comments.length;
      }
    }

    const avgTeamScore = scoredCount > 0 ? Math.round((totalScore / scoredCount) * 10) / 10 : null;
    const checkinCompletionRate = totalAchievements > 0
      ? Math.round(((totalAchievements - Object.values(quarterlyCheckins).reduce((s, q) => s + q.total - q.completed, 0)) / totalAchievements) * 100)
      : 0;

    return {
      managerId: mgr.id,
      managerName: mgr.name,
      department: mgr.department,
      teamSize,
      totalApprovedGoals,
      totalAchievements,
      totalCheckins,
      avgTeamScore,
      checkinCompletionRate,
      quarterlyBreakdown: Object.entries(quarterlyCheckins).map(([q, data]) => ({
        quarter: q,
        total: data.total,
        completed: data.completed,
        rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      })),
    };
  });
}

/**
 * Get overall organization analytics summary
 */
export async function getAnalyticsSummary() {
  const [trends, heatmap, distribution, effectiveness] = await Promise.all([
    getQoQTrends(),
    getCompletionHeatmap(),
    getGoalDistribution(),
    getManagerEffectiveness(),
  ]);

  return { trends, heatmap, distribution, effectiveness };
}

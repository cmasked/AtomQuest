import prisma from '../utils/prisma';

/**
 * Get all goal cycles, sorted by year desc, opensAt desc.
 */
export async function getAllCycles() {
  return prisma.goalCycle.findMany({
    orderBy: [{ year: 'desc' }, { opensAt: 'desc' }],
  });
}

/**
 * Create a new goal cycle.
 */
export async function createCycle(data: {
  name: string;
  phase: 'GOAL_SETTING' | 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  opensAt: string;
  closesAt: string;
}) {
  const opensAt = new Date(data.opensAt);
  const closesAt = new Date(data.closesAt);

  if (closesAt <= opensAt) {
    throw { status: 400, message: 'closesAt must be after opensAt' };
  }

  // Check no other cycle with same phase + year
  const existing = await prisma.goalCycle.findFirst({
    where: { phase: data.phase, year: data.year },
  });

  if (existing) {
    throw { status: 409, message: `A cycle with phase ${data.phase} and year ${data.year} already exists` };
  }

  return prisma.goalCycle.create({
    data: {
      name: data.name,
      phase: data.phase,
      year: data.year,
      opensAt,
      closesAt,
      isActive: false,
    },
  });
}

/**
 * Activate a cycle (deactivate all others).
 */
export async function activateCycle(cycleId: string) {
  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) {
    throw { status: 404, message: 'Cycle not found' };
  }

  // Deactivate all cycles first
  await prisma.goalCycle.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Activate the selected one
  return prisma.goalCycle.update({
    where: { id: cycleId },
    data: { isActive: true },
  });
}

/**
 * Update a cycle (name, opensAt, closesAt only — phase and year are immutable).
 */
export async function updateCycle(
  cycleId: string,
  data: { name?: string; opensAt?: string; closesAt?: string; phase?: string; year?: number }
) {
  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) {
    throw { status: 404, message: 'Cycle not found' };
  }

  // Reject immutable field changes
  if (data.phase !== undefined) {
    throw { status: 400, message: 'Cannot update phase after creation' };
  }
  if (data.year !== undefined) {
    throw { status: 400, message: 'Cannot update year after creation' };
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.opensAt !== undefined) updateData.opensAt = new Date(data.opensAt);
  if (data.closesAt !== undefined) updateData.closesAt = new Date(data.closesAt);

  // Validate date ordering if both are being changed
  const newOpensAt = updateData.opensAt ?? cycle.opensAt;
  const newClosesAt = updateData.closesAt ?? cycle.closesAt;
  if (newClosesAt <= newOpensAt) {
    throw { status: 400, message: 'closesAt must be after opensAt' };
  }

  return prisma.goalCycle.update({
    where: { id: cycleId },
    data: updateData,
  });
}

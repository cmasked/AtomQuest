import prisma from '../utils/prisma';
import { Role } from '@prisma/client';

/**
 * Get all active users with their manager info.
 */
export async function getAllUsers() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      managerId: true,
      manager: { select: { name: true } },
      createdAt: true,
    },
    orderBy: { name: 'asc' },
  });

  return users;
}

/**
 * Update a user's role and optionally their managerId.
 */
export async function updateUserRole(
  targetUserId: string,
  data: { role: string; managerId?: string | null }
) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  if (!['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(data.role)) {
    throw { status: 400, message: `Invalid role: ${data.role}. Must be EMPLOYEE, MANAGER, or ADMIN.` };
  }

  // If managerId is provided, verify the manager exists
  if (data.managerId) {
    const manager = await prisma.user.findUnique({ where: { id: data.managerId } });
    if (!manager) {
      throw { status: 404, message: 'Manager user not found' };
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      role: data.role as Role,
      ...(data.managerId !== undefined && { managerId: data.managerId || null }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managerId: true,
      department: true,
      isActive: true,
    },
  });

  return updated;
}

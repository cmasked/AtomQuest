import 'dotenv/config';
import { PrismaClient, Role, CyclePhase } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/atomquest?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (in reverse dependency order)
  await prisma.sharedGoalRecipient.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.checkinComment.deleteMany();
  await prisma.goalAchievement.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalCycle.deleteMany();
  await prisma.user.deleteMany();

  const saltRounds = 10;

  // 1. Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'HR Admin',
      email: 'hr.admin@atomberg.com',
      passwordHash: await bcrypt.hash('HrAdmin@2025', saltRounds),
      role: Role.ADMIN,
      department: 'HR',
      isActive: true,
    },
  });
  console.log(`  ✅ Admin user created: ${admin.email}`);

  // 2. Manager User
  const manager = await prisma.user.create({
    data: {
      name: 'Rohit Verma',
      email: 'rohit.verma@atomberg.com',
      passwordHash: await bcrypt.hash('Rohit@2025', saltRounds),
      role: Role.MANAGER,
      department: 'Sales',
      isActive: true,
    },
  });
  console.log(`  ✅ Manager user created: ${manager.email}`);

  // 3. Employee User (reports to Manager)
  const employee = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya.sharma@atomberg.com',
      passwordHash: await bcrypt.hash('Priya@2025', saltRounds),
      role: Role.EMPLOYEE,
      department: 'Sales',
      managerId: manager.id,
      isActive: true,
    },
  });
  console.log(`  ✅ Employee user created: ${employee.email} (manager: ${manager.email})`);

  // 4. Active Goal Cycle
  const cycle = await prisma.goalCycle.create({
    data: {
      name: 'FY 2025-26 Goal Setting',
      phase: CyclePhase.GOAL_SETTING,
      year: 2025,
      opensAt: new Date('2025-05-01T00:00:00Z'),
      closesAt: new Date('2026-06-30T23:59:59Z'),
      isActive: true,
    },
  });
  console.log(`  ✅ Goal cycle created: ${cycle.name}`);

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

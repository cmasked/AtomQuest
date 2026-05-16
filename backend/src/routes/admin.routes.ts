import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as approvalController from '../controllers/approvalController';
import * as cycleController from '../controllers/cycleController';
import * as sharedGoalController from '../controllers/sharedGoalController';
import * as checkinController from '../controllers/checkinController';
import * as userController from '../controllers/userController';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

// ─── Goal Management ─────────────────────────────────────────
// POST /api/admin/goals/:id/unlock — Admin unlock a goal
router.post('/goals/:id/unlock', approvalController.adminUnlockGoal);

// POST /api/admin/goals/shared — Create shared goal
router.post('/goals/shared', sharedGoalController.createSharedGoal);

// ─── Cycle Management ────────────────────────────────────────
// GET /api/admin/cycles
router.get('/cycles', cycleController.getAllCycles);

// POST /api/admin/cycles
router.post('/cycles', cycleController.createCycle);

// PATCH /api/admin/cycles/:id/activate
router.patch('/cycles/:id/activate', cycleController.activateCycle);

// PATCH /api/admin/cycles/:id
router.patch('/cycles/:id', cycleController.updateCycle);

// ─── Check-in Completion Report ──────────────────────────────
// GET /api/admin/checkins/completion
router.get('/checkins/completion', checkinController.getCheckinCompletion);

// ─── User Management ─────────────────────────────────────────
// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', userController.updateUserRole);

export default router;

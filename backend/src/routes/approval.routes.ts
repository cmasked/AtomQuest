import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as approvalController from '../controllers/approvalController';

const router = Router();

// All approval routes require authentication
router.use(authenticate);

// POST /api/goals/:id/submit — Submit goal for approval (EMPLOYEE)
router.post('/:id/submit', authorize('EMPLOYEE'), approvalController.submitGoal);

// POST /api/goals/:id/approve — Approve goal (MANAGER)
router.post('/:id/approve', authorize('MANAGER'), approvalController.approveGoal);

// POST /api/goals/:id/return — Return goal to employee (MANAGER)
router.post('/:id/return', authorize('MANAGER'), approvalController.returnGoal);

export default router;

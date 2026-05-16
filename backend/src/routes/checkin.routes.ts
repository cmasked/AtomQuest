import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as checkinController from '../controllers/checkinController';

const router = Router();

router.use(authenticate);

// POST /api/checkins — Manager creates/updates a check-in
router.post('/', authorize('MANAGER'), checkinController.createCheckin);

// GET /api/checkins/team — Manager's team check-ins
router.get('/team', authorize('MANAGER'), checkinController.getTeamCheckins);

// GET /api/checkins/goal/:goalId — Check-ins for a specific goal
router.get('/goal/:goalId', authorize('EMPLOYEE', 'MANAGER', 'ADMIN'), checkinController.getGoalCheckins);

export default router;

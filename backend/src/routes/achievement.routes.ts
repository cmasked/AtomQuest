import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as achievementController from '../controllers/achievementController';

const router = Router();

router.use(authenticate);

// GET /api/goals/my/achievements/summary — must be before :goalId routes
router.get('/my/achievements/summary', authorize('EMPLOYEE'), achievementController.getMyAchievementSummary);

// PATCH /api/goals/:goalId/achievement/:quarter
router.patch('/:goalId/achievement/:quarter', authorize('EMPLOYEE'), achievementController.upsertAchievement);

// GET /api/goals/:goalId/achievements
router.get('/:goalId/achievements', authorize('EMPLOYEE', 'MANAGER', 'ADMIN'), achievementController.getGoalAchievements);

export default router;

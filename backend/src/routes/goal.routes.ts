import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as goalController from '../controllers/goalController';
import * as sharedGoalController from '../controllers/sharedGoalController';

const router = Router();

// All goal routes require authentication
router.use(authenticate);

// POST /api/goals — Create goal (EMPLOYEE only)
router.post('/', authorize('EMPLOYEE'), goalController.createGoal);

// GET /api/goals/my — Get my goals (EMPLOYEE)
router.get('/my', authorize('EMPLOYEE'), goalController.getMyGoals);

// GET /api/goals/team — Get team goals (MANAGER)
router.get('/team', authorize('MANAGER'), goalController.getTeamGoals);

// PATCH /api/goals/:id/shared-weightage — Update shared goal weightage (EMPLOYEE)
router.patch('/:id/shared-weightage', authorize('EMPLOYEE'), sharedGoalController.updateSharedGoalWeightage);

// PATCH /api/goals/:id — Update goal (EMPLOYEE or MANAGER)
router.patch('/:id', authorize('EMPLOYEE', 'MANAGER', 'ADMIN'), goalController.updateGoal);

// DELETE /api/goals/:id — Delete goal (EMPLOYEE only, DRAFT status)
router.delete('/:id', authorize('EMPLOYEE'), goalController.deleteGoal);

export default router;

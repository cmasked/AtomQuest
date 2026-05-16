import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

// All analytics routes require authentication + ADMIN or MANAGER role
router.use(authenticate, authorize('ADMIN', 'MANAGER'));

// GET /api/analytics/summary — Full dashboard
router.get('/summary', analyticsController.getSummary);

// GET /api/analytics/trends — QoQ trends
router.get('/trends', analyticsController.getTrends);

// GET /api/analytics/heatmap — Completion heatmap
router.get('/heatmap', analyticsController.getHeatmap);

// GET /api/analytics/distribution — Goal distribution
router.get('/distribution', analyticsController.getDistribution);

// GET /api/analytics/manager-effectiveness — Manager effectiveness
router.get('/manager-effectiveness', analyticsController.getManagerEffectiveness);

export default router;

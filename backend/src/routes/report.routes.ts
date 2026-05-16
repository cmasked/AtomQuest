import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as reportController from '../controllers/reportController';

const router = Router();

router.use(authenticate);

// GET /api/reports/achievement — MANAGER or ADMIN
router.get('/achievement', authorize('MANAGER', 'ADMIN'), reportController.getAchievementReport);

// GET /api/reports/achievement/export — XLSX download
router.get('/achievement/export', authorize('MANAGER', 'ADMIN'), reportController.exportAchievementReport);

// GET /api/reports/completion-dashboard — ADMIN only
router.get('/completion-dashboard', authorize('ADMIN'), reportController.getCompletionDashboard);

// GET /api/reports/audit/:entityId — ADMIN only
router.get('/audit/:entityId', authorize('ADMIN'), reportController.getAuditLog);

export default router;

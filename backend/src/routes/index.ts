import { Router } from 'express';

import authRoutes from './auth.routes';
import goalRoutes from './goal.routes';
import approvalRoutes from './approval.routes';
import achievementRoutes from './achievement.routes';
import checkinRoutes from './checkin.routes';
import reportRoutes from './report.routes';
import adminRoutes from './admin.routes';

const router = Router();

// ─── Public / Auth ───────────────────────────────────────────
router.use('/auth', authRoutes);

// ─── Goal CRUD + Approval + Achievement ──────────────────────
router.use('/goals', goalRoutes);
router.use('/goals', approvalRoutes);       // submit/approve/return
router.use('/goals', achievementRoutes);    // achievement tracking

// ─── Check-ins ───────────────────────────────────────────────
router.use('/checkins', checkinRoutes);

// ─── Reports ─────────────────────────────────────────────────
router.use('/reports', reportRoutes);

// ─── Admin ───────────────────────────────────────────────────
router.use('/admin', adminRoutes);

export default router;

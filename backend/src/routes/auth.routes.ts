import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import * as ssoController from '../controllers/ssoController';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me — protected
router.get('/me', authenticate, getMe);

// ─── Microsoft Entra ID (Azure AD) SSO ──────────────────────
// GET /api/auth/sso/status — Check if SSO is configured
router.get('/sso/status', ssoController.getStatus);

// GET /api/auth/sso/login — Redirect to Microsoft login
router.get('/sso/login', ssoController.login);

// GET /api/auth/sso/callback — Handle Microsoft redirect
router.get('/sso/callback', ssoController.callback);

export default router;

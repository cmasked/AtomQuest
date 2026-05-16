import { Request, Response } from 'express';
import * as ssoService from '../services/ssoService';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * GET /api/auth/sso/status — Check if SSO is configured
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
  res.json({
    configured: ssoService.isConfigured(),
    provider: 'Microsoft Entra ID (Azure AD)',
  });
}

/**
 * GET /api/auth/sso/login — Redirect to Microsoft login
 */
export async function login(req: Request, res: Response): Promise<void> {
  if (!ssoService.isConfigured()) {
    res.status(503).json({
      error: 'SSO is not configured. Set AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, and AZURE_AD_CLIENT_SECRET in .env',
    });
    return;
  }

  const url = ssoService.getAuthorizationUrl();
  res.redirect(url);
}

/**
 * GET /api/auth/sso/callback — Handle Microsoft redirect
 */
export async function callback(req: Request, res: Response): Promise<void> {
  try {
    const code = req.query.code as string;
    if (!code) {
      res.redirect(`${FRONTEND_URL}/login?error=no_code`);
      return;
    }

    const result = await ssoService.handleCallback(code);

    // Redirect to frontend with token as query param (frontend stores it)
    const params = new URLSearchParams({
      token: result.token,
      userId: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
    });
    res.redirect(`${FRONTEND_URL}/sso-callback?${params.toString()}`);
  } catch (err: any) {
    console.error('SSO callback error:', err);
    res.redirect(`${FRONTEND_URL}/login?error=sso_failed`);
  }
}

/**
 * POST /api/admin/sso/sync — Trigger org hierarchy sync from Azure AD
 */
export async function syncHierarchy(req: Request, res: Response): Promise<void> {
  try {
    const result = await ssoService.syncOrgHierarchy();
    res.json(result);
  } catch (err: any) {
    console.error('SSO sync error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

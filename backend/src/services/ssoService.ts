import prisma from '../utils/prisma';
import jwt from 'jsonwebtoken';

/**
 * Microsoft Entra ID (Azure AD) SSO Integration
 *
 * Flow:
 * 1. Frontend redirects to /api/auth/sso/login → redirects to Microsoft login
 * 2. Microsoft calls back to /api/auth/sso/callback with authorization code
 * 3. We exchange code for tokens, extract user info, and create/link JWT
 *
 * Configuration:
 * - AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET in .env
 * - AZURE_AD_REDIRECT_URI = http://localhost:3000/api/auth/sso/callback
 */

const TENANT_ID = process.env.AZURE_AD_TENANT_ID || '';
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:3000/api/auth/sso/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`;
const AUTHORIZE_URL = `${AUTHORITY}/oauth2/v2.0/authorize`;
const TOKEN_URL = `${AUTHORITY}/oauth2/v2.0/token`;
const GRAPH_URL = 'https://graph.microsoft.com/v1.0';

export function isConfigured(): boolean {
  return Boolean(TENANT_ID && CLIENT_ID && CLIENT_SECRET);
}

/**
 * Generate the Microsoft login redirect URL
 */
export function getAuthorizationUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile email User.Read',
    response_mode: 'query',
    state: state || 'default',
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
    scope: 'openid profile email User.Read',
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw { status: 401, message: `Token exchange failed: ${error}` };
  }

  return response.json();
}

/**
 * Get user profile from Microsoft Graph API
 */
async function getUserProfile(accessToken: string) {
  const response = await fetch(`${GRAPH_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw { status: 401, message: 'Failed to fetch user profile from Microsoft Graph' };
  }

  return response.json();
}

/**
 * Get user's manager from Microsoft Graph (for org hierarchy sync)
 */
async function getUserManager(accessToken: string) {
  try {
    const response = await fetch(`${GRAPH_URL}/me/manager`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) return response.json();
  } catch (e) {
    console.log('[SSO] Could not fetch manager from Graph API');
  }
  return null;
}

/**
 * Get user's group memberships for role mapping
 */
async function getUserGroups(accessToken: string): Promise<string[]> {
  try {
    const response = await fetch(`${GRAPH_URL}/me/memberOf`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      const data: any = await response.json();
      return (data.value || [])
        .filter((g: any) => g['@odata.type'] === '#microsoft.graph.group')
        .map((g: any) => g.displayName);
    }
  } catch (e) {
    console.log('[SSO] Could not fetch groups from Graph API');
  }
  return [];
}

/**
 * Map Azure AD groups to application roles
 */
function mapGroupsToRole(groups: string[]): 'EMPLOYEE' | 'MANAGER' | 'ADMIN' {
  const lower = groups.map(g => g.toLowerCase());
  if (lower.some(g => g.includes('hr') || g.includes('admin') || g.includes('atomquest-admin'))) return 'ADMIN';
  if (lower.some(g => g.includes('manager') || g.includes('lead') || g.includes('atomquest-manager'))) return 'MANAGER';
  return 'EMPLOYEE';
}

/**
 * Handle SSO callback: exchange code → get profile → create/login user → return JWT
 */
export async function handleCallback(code: string) {
  // 1. Exchange code for tokens
  const tokens: any = await exchangeCodeForTokens(code);
  const accessToken = tokens.access_token;

  // 2. Get user profile from Microsoft Graph
  const profile: any = await getUserProfile(accessToken);
  const azureOid = profile.id;
  const email = (profile.mail || profile.userPrincipalName || '').toLowerCase();
  const name = profile.displayName || email.split('@')[0];
  const department = profile.department || 'General';

  if (!email) {
    throw { status: 400, message: 'No email found in Azure AD profile' };
  }

  // 3. Get groups for role mapping
  const groups = await getUserGroups(accessToken);
  const mappedRole = mapGroupsToRole(groups);

  // 4. Get manager for org hierarchy sync
  const managerProfile: any = await getUserManager(accessToken);

  // 5. Find or create user
  let user = await prisma.user.findFirst({
    where: { OR: [{ azureOid }, { email }] },
  });

  let managerId: string | null = null;
  if (managerProfile?.mail) {
    const manager = await prisma.user.findUnique({
      where: { email: managerProfile.mail.toLowerCase() },
    });
    if (manager) managerId = manager.id;
  }

  if (user) {
    // Update existing user with latest Azure AD info
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        azureOid,
        name,
        department,
        role: mappedRole,
        ...(managerId && { managerId }),
      },
    });
  } else {
    // Create new user (no password needed for SSO)
    const bcrypt = await import('bcrypt');
    const randomHash = await bcrypt.hash(Math.random().toString(36), 10);

    user = await prisma.user.create({
      data: {
        azureOid,
        email,
        name,
        department,
        role: mappedRole,
        passwordHash: randomHash,
        isActive: true,
        ...(managerId && { managerId }),
      },
    });
  }

  // 6. Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    ssoMetadata: {
      azureOid,
      groups,
      mappedRole,
      managerSynced: Boolean(managerId),
    },
  };
}

/**
 * Sync org hierarchy from Azure AD for all users
 * (Admin-triggered bulk sync)
 */
export async function syncOrgHierarchy(adminAccessToken?: string) {
  if (!isConfigured()) {
    return { synced: 0, message: 'Azure AD not configured' };
  }

  // This would iterate through all users and update their manager relationships
  // In practice, this uses the Graph API with app-level permissions
  const users = await prisma.user.findMany({
    where: { azureOid: { not: null }, isActive: true },
    select: { id: true, azureOid: true, email: true, name: true },
  });

  let synced = 0;
  // For each user with Azure OID, we'd query Graph API for their manager
  // This is a placeholder showing the architecture — actual implementation
  // requires app-level Graph API credentials

  return {
    synced,
    total: users.length,
    message: `Processed ${users.length} users. ${synced} manager relationships updated.`,
  };
}

import nodemailer from 'nodemailer';
import prisma from '../utils/prisma';

// ─── Email Transport ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const FROM = process.env.SMTP_FROM || 'noreply@atomberg.com';

// ─── Email Sender ───────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // Hackathon override: Send all emails to the tester's account
  const testEmail = process.env.SMTP_USER || to;

  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL-MOCK] To: ${to} | Subject: ${subject}`);
    return true; // mock success when SMTP not configured
  }
  try {
    await transporter.sendMail({ from: FROM, to: testEmail, subject, html });
    return true;
  } catch (err) {
    console.error('[EMAIL-ERROR]', err);
    return false;
  }
}

// ─── Teams Webhook Sender ───────────────────────────────────────────────────
async function sendTeamsCard(title: string, body: string, deepLink?: string): Promise<boolean> {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log(`[TEAMS-MOCK] ${title}: ${body}`);
    return true;
  }
  try {
    let payload: any;

    // Discord fallback for hackathon testing
    if (webhookUrl.includes('discord.com')) {
      payload = {
        content: `**${title}**\n${body}${deepLink ? '\n\n🔗 [Open in AtomQuest](' + deepLink + ')' : ''}`
      };
    } else {
      // Standard Microsoft Teams Adaptive Card
      payload = {
        type: 'message',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              { type: 'TextBlock', text: title, weight: 'Bolder', size: 'Medium' },
              { type: 'TextBlock', text: body, wrap: true },
            ],
            actions: deepLink ? [
              { type: 'Action.OpenUrl', title: 'Open in AtomQuest', url: deepLink },
            ] : [],
          },
        }],
      };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (err) {
    console.error('[TEAMS-ERROR]', err);
    return false;
  }
}

// ─── Log Notification ───────────────────────────────────────────────────────
async function logNotification(
  userId: string, type: 'EMAIL' | 'TEAMS', event: string,
  subject: string, body: string, success: boolean, metadata?: any
) {
  await prisma.notificationLog.create({
    data: { userId, type, event, subject, body, success, metadata },
  });
}

// ─── Event-Based Notification Functions ─────────────────────────────────────

/**
 * Notify manager when employee submits goals for approval
 */
export async function notifyGoalSubmitted(employeeId: string, goalTitle: string) {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    include: { manager: true },
  });
  if (!employee?.manager) return;

  const manager = employee.manager;
  const deepLink = `${FRONTEND_URL}/approvals`;
  const subject = `🎯 AtomQuest: ${employee.name} submitted goals for your approval`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#FF6B00;">AtomQuest — Goal Submission</h2>
      <p>Hi ${manager.name},</p>
      <p><strong>${employee.name}</strong> has submitted their goal sheet for your approval.</p>
      <p>Latest goal: <em>${goalTitle}</em></p>
      <a href="${deepLink}" style="display:inline-block;padding:10px 24px;background:#FF6B00;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px;">
        Review Goals →
      </a>
    </div>`;

  const emailOk = await sendEmail(manager.email, subject, html);
  await logNotification(manager.id, 'EMAIL', 'GOAL_SUBMITTED', subject, html, emailOk, { deepLink });

  const teamsOk = await sendTeamsCard(
    `🎯 Goal Submitted by ${employee.name}`,
    `${employee.name} has submitted their goal sheet for approval. Latest: "${goalTitle}"`,
    deepLink
  );
  await logNotification(manager.id, 'TEAMS', 'GOAL_SUBMITTED', subject, `Goal: ${goalTitle}`, teamsOk, { deepLink });
}

/**
 * Notify employee when manager approves their goal
 */
export async function notifyGoalApproved(goalId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { employee: true },
  });
  if (!goal) return;

  const deepLink = `${FRONTEND_URL}/goals`;
  const subject = `✅ AtomQuest: Your goal "${goal.title}" has been approved!`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#FF6B00;">AtomQuest — Goal Approved</h2>
      <p>Hi ${goal.employee.name},</p>
      <p>Your goal <strong>"${goal.title}"</strong> has been approved by your manager and is now locked.</p>
      <a href="${deepLink}" style="display:inline-block;padding:10px 24px;background:#22C55E;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px;">
        View My Goals →
      </a>
    </div>`;

  const ok = await sendEmail(goal.employee.email, subject, html);
  await logNotification(goal.employee.id, 'EMAIL', 'GOAL_APPROVED', subject, html, ok, { deepLink });
}

/**
 * Notify employee when manager returns their goal
 */
export async function notifyGoalReturned(goalId: string, managerNote?: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { employee: true },
  });
  if (!goal) return;

  const deepLink = `${FRONTEND_URL}/goals`;
  const subject = `🔄 AtomQuest: Your goal "${goal.title}" was returned for revision`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#FF6B00;">AtomQuest — Goal Returned</h2>
      <p>Hi ${goal.employee.name},</p>
      <p>Your goal <strong>"${goal.title}"</strong> has been returned by your manager for rework.</p>
      ${managerNote ? `<p style="background:#f1f5f9;padding:12px;border-radius:8px;border-left:4px solid #F59E0B;">
        <strong>Manager note:</strong> ${managerNote}
      </p>` : ''}
      <a href="${deepLink}" style="display:inline-block;padding:10px 24px;background:#FF6B00;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px;">
        Edit Goal →
      </a>
    </div>`;

  const ok = await sendEmail(goal.employee.email, subject, html);
  await logNotification(goal.employee.id, 'EMAIL', 'GOAL_RETURNED', subject, html, ok, { deepLink, managerNote });
}

/**
 * Notify employee about quarterly check-in reminder
 */
export async function notifyCheckinReminder(employeeId: string, quarter: string) {
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const deepLink = `${FRONTEND_URL}/progress`;
  const subject = `⏰ AtomQuest: ${quarter} check-in reminder`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#FF6B00;">AtomQuest — Check-in Reminder</h2>
      <p>Hi ${employee.name},</p>
      <p>This is a reminder to complete your <strong>${quarter}</strong> achievement entries.</p>
      <p>Please update your actual values and progress status for all approved goals.</p>
      <a href="${deepLink}" style="display:inline-block;padding:10px 24px;background:#FF6B00;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px;">
        Update Progress →
      </a>
    </div>`;

  const ok = await sendEmail(employee.email, subject, html);
  await logNotification(employee.id, 'EMAIL', 'CHECKIN_REMINDER', subject, html, ok, { deepLink, quarter });
}

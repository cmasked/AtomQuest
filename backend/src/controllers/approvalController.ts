import { Request, Response } from 'express';
import * as approvalService from '../services/approvalService';

/**
 * POST /api/goals/:id/submit — Submit a goal for approval (EMPLOYEE)
 */
export async function submitGoal(req: Request, res: Response): Promise<void> {
  try {
    const goal = await approvalService.submitGoal(req.params.id as string, req.user!.userId);
    res.json(goal);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Submit goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/goals/:id/approve — Approve a goal (MANAGER)
 */
export async function approveGoal(req: Request, res: Response): Promise<void> {
  try {
    const goal = await approvalService.approveGoal(req.params.id as string, req.user!.userId);
    res.json(goal);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Approve goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/goals/:id/return — Return a goal to employee (MANAGER)
 */
export async function returnGoal(req: Request, res: Response): Promise<void> {
  try {
    const goal = await approvalService.returnGoal(
      req.params.id as string,
      req.user!.userId,
      req.body.managerNote
    );
    res.json(goal);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Return goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/goals/:id/unlock — Admin unlock a goal (ADMIN)
 */
export async function adminUnlockGoal(req: Request, res: Response): Promise<void> {
  try {
    const goal = await approvalService.adminUnlockGoal(req.params.id as string, req.user!.userId);
    res.json(goal);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Admin unlock error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

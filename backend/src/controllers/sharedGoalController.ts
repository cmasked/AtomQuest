import { Request, Response } from 'express';
import * as sharedGoalService from '../services/sharedGoalService';

/**
 * POST /api/admin/goals/shared
 */
export async function createSharedGoal(req: Request, res: Response): Promise<void> {
  try {
    const result = await sharedGoalService.createSharedGoal(req.user!.userId, req.body);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Create shared goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/goals/:id/shared-weightage
 */
export async function updateSharedGoalWeightage(req: Request, res: Response): Promise<void> {
  try {
    const result = await sharedGoalService.updateSharedGoalWeightage(
      req.params.id as string,
      req.user!.userId,
      req.body
    );
    res.json(result);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Update shared weightage error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

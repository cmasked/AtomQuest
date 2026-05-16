import { Request, Response } from 'express';
import * as achievementService from '../services/achievementService';

/**
 * PATCH /api/goals/:goalId/achievement/:quarter
 */
export async function upsertAchievement(req: Request, res: Response): Promise<void> {
  try {
    const result = await achievementService.upsertAchievement(
      req.params.goalId as string,
      req.params.quarter as string,
      req.user!.userId,
      req.body
    );
    res.json(result);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Upsert achievement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/goals/:goalId/achievements
 */
export async function getGoalAchievements(req: Request, res: Response): Promise<void> {
  try {
    const achievements = await achievementService.getGoalAchievements(
      req.params.goalId as string,
      req.user!.userId,
      req.user!.role
    );
    res.json({ achievements });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Get achievements error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/goals/my/achievements/summary
 */
export async function getMyAchievementSummary(req: Request, res: Response): Promise<void> {
  try {
    const summary = await achievementService.getMyAchievementSummary(req.user!.userId);
    res.json({ summary });
  } catch (err: any) {
    console.error('Get achievement summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

import { Request, Response } from 'express';
import * as checkinService from '../services/checkinService';

/**
 * POST /api/checkins
 */
export async function createCheckin(req: Request, res: Response): Promise<void> {
  try {
    const result = await checkinService.upsertCheckin(req.user!.userId, req.body);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Create checkin error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/checkins/team
 */
export async function getTeamCheckins(req: Request, res: Response): Promise<void> {
  try {
    const result = await checkinService.getTeamCheckins(req.user!.userId);
    res.json({ checkins: result });
  } catch (err: any) {
    console.error('Get team checkins error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/checkins/goal/:goalId
 */
export async function getGoalCheckins(req: Request, res: Response): Promise<void> {
  try {
    const result = await checkinService.getGoalCheckins(
      req.params.goalId as string,
      req.user!.userId,
      req.user!.role
    );
    res.json({ comments: result });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Get goal checkins error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/checkins/completion
 */
export async function getCheckinCompletion(req: Request, res: Response): Promise<void> {
  try {
    const quarter = req.query.quarter as string;
    if (!quarter) {
      res.status(400).json({ error: 'quarter query param is required' });
      return;
    }
    const result = await checkinService.getCheckinCompletion(quarter);
    res.json({ report: result });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Get checkin completion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

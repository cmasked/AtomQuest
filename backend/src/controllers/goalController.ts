import { Request, Response } from 'express';
import * as goalService from '../services/goalService';

/**
 * POST /api/goals — Create a new goal (EMPLOYEE only)
 */
export async function createGoal(req: Request, res: Response): Promise<void> {
  try {
    const employeeId = req.user!.userId;
    const goal = await goalService.createGoal(employeeId, req.body);
    res.status(201).json(goal);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/goals/my — Get all my goals in active cycle (EMPLOYEE)
 */
export async function getMyGoals(req: Request, res: Response): Promise<void> {
  try {
    const goals = await goalService.getMyGoals(req.user!.userId);
    res.json({ goals });
  } catch (err: any) {
    console.error('Get my goals error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/goals/team — Get team goals grouped by employee (MANAGER)
 */
export async function getTeamGoals(req: Request, res: Response): Promise<void> {
  try {
    const team = await goalService.getTeamGoals(req.user!.userId);
    res.json({ team });
  } catch (err: any) {
    console.error('Get team goals error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/goals/:id — Update a goal
 */
export async function updateGoal(req: Request, res: Response): Promise<void> {
  try {
    const goal = await goalService.updateGoal(
      req.params.id as string,
      req.user!.userId,
      req.user!.role,
      req.body
    );
    res.json(goal);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/goals/:id — Delete a goal (EMPLOYEE, DRAFT only)
 */
export async function deleteGoal(req: Request, res: Response): Promise<void> {
  try {
    const result = await goalService.deleteGoal(req.params.id as string, req.user!.userId);
    res.json(result);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

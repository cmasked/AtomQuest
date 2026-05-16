import { Request, Response } from 'express';
import * as cycleService from '../services/cycleService';

/**
 * GET /api/admin/cycles
 */
export async function getAllCycles(req: Request, res: Response): Promise<void> {
  try {
    const cycles = await cycleService.getAllCycles();
    res.json({ cycles });
  } catch (err: any) {
    console.error('Get cycles error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/cycles
 */
export async function createCycle(req: Request, res: Response): Promise<void> {
  try {
    const cycle = await cycleService.createCycle(req.body);
    res.status(201).json(cycle);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Create cycle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/admin/cycles/:id/activate
 */
export async function activateCycle(req: Request, res: Response): Promise<void> {
  try {
    const cycle = await cycleService.activateCycle(req.params.id as string);
    res.json(cycle);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Activate cycle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/admin/cycles/:id
 */
export async function updateCycle(req: Request, res: Response): Promise<void> {
  try {
    const cycle = await cycleService.updateCycle(req.params.id as string, req.body);
    res.json(cycle);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Update cycle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

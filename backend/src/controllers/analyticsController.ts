import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService';

/**
 * GET /api/analytics/summary — Full analytics dashboard data
 */
export async function getSummary(req: Request, res: Response): Promise<void> {
  try {
    const data = await analyticsService.getAnalyticsSummary();
    res.json(data);
  } catch (err: any) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/analytics/trends — QoQ achievement trends
 */
export async function getTrends(req: Request, res: Response): Promise<void> {
  try {
    const trends = await analyticsService.getQoQTrends({
      employeeId: req.query.employeeId as string | undefined,
      managerId: req.query.managerId as string | undefined,
      department: req.query.department as string | undefined,
    });
    res.json({ trends });
  } catch (err: any) {
    console.error('Analytics trends error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/analytics/heatmap — Completion heatmap
 */
export async function getHeatmap(req: Request, res: Response): Promise<void> {
  try {
    const heatmap = await analyticsService.getCompletionHeatmap();
    res.json({ heatmap });
  } catch (err: any) {
    console.error('Analytics heatmap error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/analytics/distribution — Goal distribution analysis
 */
export async function getDistribution(req: Request, res: Response): Promise<void> {
  try {
    const distribution = await analyticsService.getGoalDistribution();
    res.json(distribution);
  } catch (err: any) {
    console.error('Analytics distribution error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/analytics/manager-effectiveness — Manager comparison
 */
export async function getManagerEffectiveness(req: Request, res: Response): Promise<void> {
  try {
    const effectiveness = await analyticsService.getManagerEffectiveness();
    res.json({ managers: effectiveness });
  } catch (err: any) {
    console.error('Analytics manager effectiveness error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

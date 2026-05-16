import { Request, Response } from 'express';
import * as escalationService from '../services/escalationService';

/**
 * POST /api/admin/escalation/rules
 */
export async function createRule(req: Request, res: Response): Promise<void> {
  try {
    const rule = await escalationService.createRule(req.body);
    res.status(201).json(rule);
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ error: err.message }); return; }
    console.error('Create escalation rule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/escalation/rules
 */
export async function getRules(req: Request, res: Response): Promise<void> {
  try {
    const rules = await escalationService.getRules(req.query.cycleId as string | undefined);
    res.json({ rules });
  } catch (err: any) {
    console.error('Get escalation rules error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/admin/escalation/rules/:id
 */
export async function updateRule(req: Request, res: Response): Promise<void> {
  try {
    const rule = await escalationService.updateRule(req.params.id as string, req.body);
    res.json(rule);
  } catch (err: any) {
    if (err.status) { res.status(err.status).json({ error: err.message }); return; }
    console.error('Update escalation rule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/escalation/rules/:id
 */
export async function deleteRule(req: Request, res: Response): Promise<void> {
  try {
    const result = await escalationService.deleteRule(req.params.id as string);
    res.json(result);
  } catch (err: any) {
    console.error('Delete escalation rule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/escalation/logs
 */
export async function getLogs(req: Request, res: Response): Promise<void> {
  try {
    const logs = await escalationService.getEscalationLogs({
      ruleId: req.query.ruleId as string | undefined,
      status: req.query.status as string | undefined,
    });
    res.json({ logs });
  } catch (err: any) {
    console.error('Get escalation logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/escalation/logs/:id/resolve
 */
export async function resolveLog(req: Request, res: Response): Promise<void> {
  try {
    const log = await escalationService.resolveEscalation(req.params.id as string);
    res.json(log);
  } catch (err: any) {
    console.error('Resolve escalation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/escalation/run — Manually trigger escalation check
 */
export async function runCheck(req: Request, res: Response): Promise<void> {
  try {
    const result = await escalationService.runEscalationCheck();
    res.json(result);
  } catch (err: any) {
    console.error('Run escalation check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

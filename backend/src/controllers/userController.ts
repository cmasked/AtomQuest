import { Request, Response } from 'express';
import * as userService from '../services/userService';

/**
 * PATCH /api/admin/users/:id/role
 */
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  try {
    const result = await userService.updateUserRole(req.params.id as string, req.body);
    res.json(result);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Update user role error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

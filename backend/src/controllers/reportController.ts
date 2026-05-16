import { Request, Response } from 'express';
import * as reportService from '../services/reportService';

/**
 * GET /api/reports/achievement
 */
export async function getAchievementReport(req: Request, res: Response): Promise<void> {
  try {
    const rows = await reportService.getAchievementReport(
      req.user!.userId,
      req.user!.role,
      {
        cycleId: req.query.cycleId as string | undefined,
        quarter: req.query.quarter as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
      }
    );
    res.json({ report: rows });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Get achievement report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/reports/achievement/export
 */
export async function exportAchievementReport(req: Request, res: Response): Promise<void> {
  try {
    const ExcelJS = await import('exceljs');
    const rows = await reportService.getAchievementReport(
      req.user!.userId,
      req.user!.role,
      {
        cycleId: req.query.cycleId as string | undefined,
        quarter: req.query.quarter as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
      }
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Achievement Report');

    sheet.columns = [
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Goal Title', key: 'goalTitle', width: 30 },
      { header: 'Thrust Area', key: 'thrustArea', width: 20 },
      { header: 'UoM Type', key: 'uomType', width: 15 },
      { header: 'Target', key: 'targetValue', width: 12 },
      { header: 'Weightage', key: 'weightage', width: 12 },
      { header: 'Quarter', key: 'quarter', width: 10 },
      { header: 'Actual', key: 'actualValue', width: 12 },
      { header: 'Score (%)', key: 'computedScore', width: 12 },
      { header: 'Status', key: 'progressStatus', width: 15 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const row of rows) {
      sheet.addRow(row);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="achievement_report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Export report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/reports/completion-dashboard
 */
export async function getCompletionDashboard(req: Request, res: Response): Promise<void> {
  try {
    const dashboard = await reportService.getCompletionDashboard();
    res.json(dashboard);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Get completion dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/reports/audit/:entityId
 */
export async function getAuditLog(req: Request, res: Response): Promise<void> {
  try {
    const logs = await reportService.getAuditLog(req.params.entityId as string);
    res.json({ logs });
  } catch (err: any) {
    console.error('Get audit log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

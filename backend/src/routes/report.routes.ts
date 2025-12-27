import express from 'express';
import {
  createReport,
  getUserReports,
  getAllReports,
  getReportDetails,
  updateReportStatus,
  getReportStats,
} from '../controllers/report.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';

const router = express.Router();

// User routes
router.post('/reports', authenticate, createReport);
router.get('/reports/my', authenticate, getUserReports);

// Admin routes
router.get('/admin/reports', authenticate, requireAdmin, getAllReports);
router.get('/admin/reports/stats', authenticate, requireAdmin, getReportStats);
router.get('/admin/reports/:reportId', authenticate, requireAdmin, getReportDetails);
router.put('/admin/reports/:reportId', authenticate, requireAdmin, updateReportStatus);

export default router;

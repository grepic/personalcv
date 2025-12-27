import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(adminController.requireAdmin);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId/ban', adminController.banUser);
router.put('/users/:userId/unban', adminController.unbanUser);
router.delete('/users/:userId', adminController.deleteUser);

// Job management
router.get('/jobs', adminController.getAllJobs);
router.put('/jobs/:jobId/approve', adminController.approveJob);
router.put('/jobs/:jobId/reject', adminController.rejectJob);
router.delete('/jobs/:jobId', adminController.deleteJob);

// Post management
router.get('/posts', adminController.getAllPosts);
router.delete('/posts/:postId', adminController.deletePost);

// Reports and moderation
router.get('/reports', adminController.getReports);
router.put('/reports/:reportId/resolve', adminController.resolveReport);

// Analytics
router.get('/analytics/users', adminController.getUserAnalytics);
router.get('/analytics/jobs', adminController.getJobAnalytics);
router.get('/analytics/revenue', adminController.getRevenueAnalytics);

export default router;
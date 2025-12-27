import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as cmsController from '../controllers/cms.controller';
import { requireAdmin } from '../controllers/admin.controller';

const router = Router();

// Public routes
router.get('/pages/:slug', cmsController.getPageBySlug);
router.get('/seo/:page', cmsController.getSeoSettings);

// Admin routes
router.use(authenticate);
router.use(requireAdmin);

// SEO Management
router.get('/admin/seo', cmsController.getAllSeoSettings);
router.put('/admin/seo/:page', cmsController.updateSeoSettings);

// Page Management
router.get('/admin/pages', cmsController.getAllPages);
router.post('/admin/pages', cmsController.createPage);
router.get('/admin/pages/:id', cmsController.getPage);
router.put('/admin/pages/:id', cmsController.updatePage);
router.delete('/admin/pages/:id', cmsController.deletePage);
router.put('/admin/pages/:id/publish', cmsController.publishPage);
router.put('/admin/pages/:id/unpublish', cmsController.unpublishPage);

export default router;
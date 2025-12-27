import { Router } from 'express';
import * as seoController from '../controllers/seo.controller';

const router = Router();

// Public routes
router.get('/sitemap.xml', seoController.generateSitemap);

export default router;
import { Router } from 'express';
import * as portfolioController from '../controllers/portfolio.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/portfolio', authenticate, portfolioController.createPortfolioProject);
router.get('/users/:userId/portfolio', portfolioController.getUserPortfolioProjects);
router.put('/portfolio/:projectId', authenticate, portfolioController.updatePortfolioProject);
router.delete('/portfolio/:projectId', authenticate, portfolioController.deletePortfolioProject);

export default router;

import { Router } from 'express';
import * as recommendationController from '../controllers/recommendation.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/recommendations', authenticate, recommendationController.createRecommendation);
router.get('/users/:userId/recommendations', recommendationController.getUserRecommendations);
router.put('/recommendations/:recommendationId', authenticate, recommendationController.updateRecommendation);
router.delete('/recommendations/:recommendationId', authenticate, recommendationController.deleteRecommendation);
router.patch('/recommendations/:recommendationId/visibility', authenticate, recommendationController.toggleRecommendationVisibility);

export default router;

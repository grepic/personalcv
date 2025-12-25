import { Router } from 'express';
import * as reviewController from '../controllers/candidateReview.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/candidates/:candidateId/reviews', authenticate, reviewController.createCandidateReview);
router.get('/candidates/:candidateId/reviews', authenticate, reviewController.getCandidateReviews);
router.put('/reviews/:reviewId', authenticate, reviewController.updateCandidateReview);

export default router;

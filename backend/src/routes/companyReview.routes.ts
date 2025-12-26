import { Router } from 'express';
import * as companyReviewController from '../controllers/companyReview.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/companies/:companyId/reviews', authenticate, companyReviewController.createCompanyReview);
router.get('/companies/:companyId/reviews', companyReviewController.getCompanyReviews);
router.put('/company-reviews/:reviewId', authenticate, companyReviewController.updateCompanyReview);
router.delete('/company-reviews/:reviewId', authenticate, companyReviewController.deleteCompanyReview);

export default router;

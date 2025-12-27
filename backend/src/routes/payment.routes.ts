import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create payment intent for job posting
router.post('/job-posting', paymentController.createJobPayment);

// Verify payment
router.post('/verify/:paymentId', paymentController.verifyPayment);

// Create subscription for company
router.post('/subscription', paymentController.createSubscription);

// Cancel subscription
router.post('/subscription/cancel', paymentController.cancelSubscription);

// Get payment history
router.get('/history', paymentController.getPaymentHistory);

export default router;

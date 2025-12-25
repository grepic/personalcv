import { Router } from 'express';
import * as applicationController from '../controllers/application.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/jobs/:jobId/apply', authenticate, applicationController.applyToJob);
router.get('/jobs/:jobId/applications', authenticate, applicationController.getJobApplications);
router.patch('/:applicationId/status', authenticate, applicationController.updateApplicationStatus);
router.get('/my-applications', authenticate, applicationController.getMyApplications);

export default router;

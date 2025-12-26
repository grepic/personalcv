import { Router } from 'express';
import * as savedJobController from '../controllers/savedJob.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/jobs/:jobId/save', authenticate, savedJobController.toggleSaveJob);
router.get('/jobs/:jobId/saved', authenticate, savedJobController.checkJobSaved);
router.get('/saved-jobs', authenticate, savedJobController.getSavedJobs);

export default router;

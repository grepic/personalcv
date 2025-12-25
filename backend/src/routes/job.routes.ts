import { Router } from 'express';
import * as jobController from '../controllers/job.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/', authenticate, jobController.createJob);
router.get('/', jobController.getJobs);
router.get('/:jobId', jobController.getJob);
router.put('/:jobId', authenticate, jobController.updateJob);
router.patch('/:jobId/status', authenticate, jobController.updateJobStatus);

export default router;

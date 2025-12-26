import { Router } from 'express';
import * as serviceController from '../controllers/service.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/services', authenticate, serviceController.createFreelancerService);
router.get('/users/:userId/services', serviceController.getUserFreelancerServices);
router.put('/services/:serviceId', authenticate, serviceController.updateFreelancerService);
router.delete('/services/:serviceId', authenticate, serviceController.deleteFreelancerService);

export default router;

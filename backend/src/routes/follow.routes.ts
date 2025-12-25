import { Router } from 'express';
import * as followController from '../controllers/follow.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/companies/:companyId', authenticate, followController.followCompany);
router.delete('/companies/:companyId', authenticate, followController.unfollowCompany);
router.get('/companies', authenticate, followController.getFollowedCompanies);

router.post('/roles', authenticate, followController.addFollowedRole);
router.delete('/roles/:roleId', authenticate, followController.removeFollowedRole);
router.get('/roles', authenticate, followController.getFollowedRoles);

export default router;

import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/onboarding', authenticate, userController.onboarding);
router.get('/profile/:userId', userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);

router.post('/skills', authenticate, userController.addSkill);
router.delete('/skills/:skillId', authenticate, userController.removeSkill);

router.post('/experience', authenticate, userController.addExperience);
router.put('/experience/:experienceId', authenticate, userController.updateExperience);
router.delete('/experience/:experienceId', authenticate, userController.deleteExperience);

router.get('/search', userController.searchUsers);

export default router;

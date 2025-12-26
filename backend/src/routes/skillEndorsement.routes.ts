import { Router } from 'express';
import * as skillEndorsementController from '../controllers/skillEndorsement.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/skills/:skillId/endorse', authenticate, skillEndorsementController.toggleEndorseSkill);
router.get('/skills/:skillId/endorsements', skillEndorsementController.getSkillEndorsements);
router.get('/users/:userId/skills/endorsements', skillEndorsementController.getUserSkillsWithEndorsements);

export default router;

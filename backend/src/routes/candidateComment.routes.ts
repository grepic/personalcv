import { Router } from 'express';
import * as commentController from '../controllers/candidateComment.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/candidates/:candidateId/comments', authenticate, commentController.createCandidateComment);
router.get('/candidates/:candidateId/comments', authenticate, commentController.getCandidateComments);
router.put('/comments/:commentId', authenticate, commentController.updateCandidateComment);

export default router;

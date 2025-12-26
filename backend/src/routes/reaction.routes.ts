import { Router } from 'express';
import * as reactionController from '../controllers/reaction.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/posts/:postId/reactions', authenticate, reactionController.toggleReaction);
router.get('/posts/:postId/reactions', reactionController.getPostReactions);

export default router;

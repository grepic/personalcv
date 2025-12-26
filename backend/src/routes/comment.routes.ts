import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/posts/:postId/comments', authenticate, commentController.createComment);
router.get('/posts/:postId/comments', commentController.getPostComments);
router.delete('/comments/:commentId', authenticate, commentController.deleteComment);

export default router;

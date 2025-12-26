import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/feed', authenticate, postController.getFeed);
router.post('/', authenticate, postController.createPost);
router.get('/:postId', postController.getPost);
router.put('/:postId', authenticate, postController.updatePost);
router.delete('/:postId', authenticate, postController.deletePost);

export default router;

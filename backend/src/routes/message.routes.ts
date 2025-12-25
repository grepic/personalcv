import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/conversations', authenticate, messageController.getConversations);
router.get('/conversations/:conversationId/messages', authenticate, messageController.getMessages);
router.post('/conversations/:conversationId/messages', authenticate, messageController.sendMessage);
router.post('/conversations/start', authenticate, messageController.startConversation);

export default router;

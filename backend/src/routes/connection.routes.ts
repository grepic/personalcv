import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as connectionController from '../controllers/connection.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Send connection request
router.post('/request', connectionController.sendConnectionRequest);

// Respond to connection request (accept/reject)
router.post('/:connectionId/respond', connectionController.respondToConnection);

// Get my connections
router.get('/my-connections', connectionController.getMyConnections);

// Get pending connection requests
router.get('/pending', connectionController.getPendingRequests);

// Remove connection
router.delete('/:connectionId', connectionController.removeConnection);

// Get connection status with a user
router.get('/status/:userId', connectionController.getConnectionStatus);

export default router;

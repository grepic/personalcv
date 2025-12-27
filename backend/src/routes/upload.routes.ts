import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as uploadController from '../controllers/upload.controller';
import { uploadImage, uploadDocument } from '../config/multer';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload avatar
router.post('/avatar', uploadImage.single('avatar'), uploadController.uploadAvatar);

// Upload portfolio image
router.post('/portfolio', uploadImage.single('image'), uploadController.uploadPortfolioImage);

// Upload CV/Resume document
router.post('/cv', uploadDocument.single('cv'), uploadController.uploadCV);

// Delete uploaded file
router.delete('/file/:filename', uploadController.deleteFile);

export default router;

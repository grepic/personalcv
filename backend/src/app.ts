import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import notificationRoutes from './routes/notification.routes';
import followRoutes from './routes/follow.routes';
import messageRoutes from './routes/message.routes';
import candidateReviewRoutes from './routes/candidateReview.routes';
import candidateCommentRoutes from './routes/candidateComment.routes';
import companyReviewRoutes from './routes/companyReview.routes';
import portfolioRoutes from './routes/portfolio.routes';
import serviceRoutes from './routes/service.routes';
import recommendationRoutes from './routes/recommendation.routes';
import reactionRoutes from './routes/reaction.routes';
import commentRoutes from './routes/comment.routes';
import savedJobRoutes from './routes/savedJob.routes';
import skillEndorsementRoutes from './routes/skillEndorsement.routes';
import cvParserRoutes from './routes/cvParser.routes';
import connectionRoutes from './routes/connection.routes';
import uploadRoutes from './routes/upload.routes';
import paymentRoutes from './routes/payment.routes';

import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', candidateReviewRoutes);
app.use('/api', candidateCommentRoutes);
app.use('/api', companyReviewRoutes);
app.use('/api', portfolioRoutes);
app.use('/api', serviceRoutes);
app.use('/api', recommendationRoutes);
app.use('/api', reactionRoutes);
app.use('/api', commentRoutes);
app.use('/api', savedJobRoutes);
app.use('/api', skillEndorsementRoutes);
app.use('/api', cvParserRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

export default app;

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';

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
import seoRoutes from './routes/seo.routes';
import adminRoutes from './routes/admin.routes';
import cmsRoutes from './routes/cms.routes';
import reportRoutes from './routes/report.routes';

import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
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
app.use('/api/admin', adminRoutes);
app.use('/api', reportRoutes);

// SEO routes (no /api prefix)
app.use(seoRoutes);

// CMS routes
app.use('/api/cms', cmsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

export default app;

import app from './app';
import dotenv from 'dotenv';
import { initializeCronJobs } from './services/cronJobs';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Initialize cron jobs
initializeCronJobs();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { JobStatus } from '@prisma/client';

/**
 * Close expired job postings
 * Runs every hour
 */
export const closeExpiredJobs = cron.schedule('0 * * * *', async () => {
  try {
    const result = await prisma.job.updateMany({
      where: {
        status: JobStatus.OPEN,
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        status: JobStatus.CLOSED,
      },
    });

    if (result.count > 0) {
      console.log(`✅ Closed ${result.count} expired job(s)`);
    }
  } catch (error) {
    console.error('Error closing expired jobs:', error);
  }
});

/**
 * Clean up old refresh tokens
 * Runs daily at 2 AM
 */
export const cleanupExpiredTokens = cron.schedule('0 2 * * *', async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    if (result.count > 0) {
      console.log(`✅ Deleted ${result.count} expired token(s)`);
    }
  } catch (error) {
    console.error('Error cleaning up tokens:', error);
  }
});

/**
 * Process expired subscriptions
 * Runs daily at 3 AM
 */
export const processExpiredSubscriptions = cron.schedule('0 3 * * *', async () => {
  try {
    const result = await prisma.companySubscription.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      console.log(`✅ Expired ${result.count} subscription(s)`);
      // TODO: Send email notifications to companies
    }
  } catch (error) {
    console.error('Error processing expired subscriptions:', error);
  }
});

/**
 * Initialize all cron jobs
 */
export const initializeCronJobs = () => {
  console.log('🕐 Initializing cron jobs...');

  closeExpiredJobs.start();
  cleanupExpiredTokens.start();
  processExpiredSubscriptions.start();

  console.log('✅ Cron jobs initialized:');
  console.log('  - Close expired jobs: Every hour');
  console.log('  - Cleanup expired tokens: Daily at 2 AM');
  console.log('  - Process expired subscriptions: Daily at 3 AM');
};

/**
 * Stop all cron jobs (useful for testing)
 */
export const stopAllCronJobs = () => {
  closeExpiredJobs.stop();
  cleanupExpiredTokens.stop();
  processExpiredSubscriptions.stop();
  console.log('🛑 All cron jobs stopped');
};

import { PrismaClient } from '@prisma/client';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock Prisma Client for tests
jest.mock('../lib/prisma', () => ({
  prisma: new PrismaClient(),
}));

// Mock email service to prevent actual emails in tests
jest.mock('../services/emailService', () => ({
  emailService: {
    sendEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendConnectionRequestEmail: jest.fn().mockResolvedValue(true),
    sendApplicationReceivedEmail: jest.fn().mockResolvedValue(true),
    sendApplicationStatusEmail: jest.fn().mockResolvedValue(true),
    sendEmailVerification: jest.fn().mockResolvedValue(true),
  },
}));

// Mock Stripe service
jest.mock('../services/stripeService', () => ({
  createJobPaymentIntent: jest.fn(),
  createSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  createCheckoutSession: jest.fn(),
}));

// Clean up after all tests
afterAll(async () => {
  // Close database connections
  await new PrismaClient().$disconnect();
});

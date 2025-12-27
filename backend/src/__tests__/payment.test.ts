import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Payment System', () => {
  let companyToken: string;
  let companyId: string;
  let jobId: string;
  let paymentIntentId: string;

  const companyUser = {
    email: 'payment-company@example.com',
    password: 'TestPassword123!',
    displayName: 'Payment Test Company',
  };

  beforeAll(async () => {
    // Clean up
    await prisma.job.deleteMany({
      where: { company: { email: companyUser.email } },
    });

    await prisma.user.deleteMany({
      where: { email: companyUser.email },
    });

    // Create company user
    const response = await request(app)
      .post('/api/auth/register')
      .send(companyUser);
    companyToken = response.body.accessToken;
    companyId = response.body.user.id;

    // Set company role
    await prisma.user.update({
      where: { id: companyId },
      data: { roles: ['COMPANY'] },
    });

    // Create a job for payment tests
    const jobResponse = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        title: 'Payment Test Job',
        description: 'Job for testing payments',
        location: 'Prague',
        employmentType: 'FULL_TIME',
      });
    jobId = jobResponse.body.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.payment.deleteMany({
      where: { companyId: companyId },
    });

    await prisma.job.deleteMany({
      where: { companyId: companyId },
    });

    await prisma.user.deleteMany({
      where: { email: companyUser.email },
    });

    await prisma.$disconnect();
  });

  describe('Job Payment', () => {
    describe('POST /api/payments/job', () => {
      it('should create job payment intent for STANDARD tier', async () => {
        const response = await request(app)
          .post('/api/payments/job')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            jobId: jobId,
            tier: 'STANDARD',
          })
          .expect(201);

        expect(response.body).toHaveProperty('paymentIntentId');
        expect(response.body).toHaveProperty('clientSecret');
        expect(response.body).toHaveProperty('amount');
        expect(response.body.amount).toBe(4990); // STANDARD tier price

        paymentIntentId = response.body.paymentIntentId;
      });

      it('should create job payment intent for FEATURED tier', async () => {
        const response = await request(app)
          .post('/api/payments/job')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            jobId: jobId,
            tier: 'FEATURED',
          })
          .expect(201);

        expect(response.body.amount).toBe(9990); // FEATURED tier price
      });

      it('should create job payment intent for PREMIUM tier', async () => {
        const response = await request(app)
          .post('/api/payments/job')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            jobId: jobId,
            tier: 'PREMIUM',
          })
          .expect(201);

        expect(response.body.amount).toBe(14990); // PREMIUM tier price
      });

      it('should reject FREE tier payment', async () => {
        const response = await request(app)
          .post('/api/payments/job')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            jobId: jobId,
            tier: 'FREE',
          })
          .expect(400);

        expect(response.body.error).toContain('Free tier');
      });

      it('should reject invalid tier', async () => {
        const response = await request(app)
          .post('/api/payments/job')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            jobId: jobId,
            tier: 'INVALID_TIER',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should reject payment for non-existent job', async () => {
        const response = await request(app)
          .post('/api/payments/job')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            jobId: 'non-existent-id',
            tier: 'STANDARD',
          })
          .expect(404);

        expect(response.body.error).toContain('Job not found');
      });
    });

    describe('POST /api/payments/verify', () => {
      it('should verify successful payment', async () => {
        // Mock successful payment verification
        const response = await request(app)
          .post('/api/payments/verify')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            paymentIntentId: paymentIntentId,
          })
          .expect(200);

        expect(response.body).toHaveProperty('verified', true);
        expect(response.body).toHaveProperty('payment');
      });

      it('should handle failed payment verification', async () => {
        const response = await request(app)
          .post('/api/payments/verify')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            paymentIntentId: 'pi_invalid_id',
          })
          .expect(400);

        expect(response.body).toHaveProperty('verified', false);
      });
    });
  });

  describe('Company Subscriptions', () => {
    describe('POST /api/payments/subscription', () => {
      it('should create PROFESSIONAL subscription', async () => {
        const response = await request(app)
          .post('/api/payments/subscription')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            plan: 'PROFESSIONAL',
          })
          .expect(201);

        expect(response.body).toHaveProperty('subscriptionId');
        expect(response.body).toHaveProperty('clientSecret');
        expect(response.body.plan).toBe('PROFESSIONAL');
      });

      it('should create ENTERPRISE subscription', async () => {
        const response = await request(app)
          .post('/api/payments/subscription')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            plan: 'ENTERPRISE',
          })
          .expect(201);

        expect(response.body.plan).toBe('ENTERPRISE');
      });

      it('should reject FREE plan subscription', async () => {
        const response = await request(app)
          .post('/api/payments/subscription')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            plan: 'FREE',
          })
          .expect(400);

        expect(response.body.error).toContain('Free plan');
      });

      it('should reject subscription for non-company user', async () => {
        // Create candidate user
        const candidateResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'candidate-payment@example.com',
            password: 'TestPassword123!',
            displayName: 'Candidate User',
          });

        const response = await request(app)
          .post('/api/payments/subscription')
          .set('Authorization', `Bearer ${candidateResponse.body.accessToken}`)
          .send({
            plan: 'PROFESSIONAL',
          })
          .expect(403);

        expect(response.body.error).toContain('Only companies');

        // Clean up
        await prisma.user.deleteMany({
          where: { email: 'candidate-payment@example.com' },
        });
      });
    });

    describe('POST /api/payments/subscription/cancel', () => {
      let subscriptionId: string;

      beforeAll(async () => {
        // Create a subscription first
        const sub = await prisma.companySubscription.create({
          data: {
            companyId: companyId,
            plan: 'PROFESSIONAL',
            status: 'ACTIVE',
            stripeSubscriptionId: 'sub_test_123',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        subscriptionId = sub.id;
      });

      it('should cancel subscription', async () => {
        const response = await request(app)
          .post('/api/payments/subscription/cancel')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            subscriptionId: subscriptionId,
          })
          .expect(200);

        expect(response.body).toHaveProperty('cancelled', true);
        expect(response.body.subscription).toHaveProperty('status', 'CANCELLED');
      });

      it('should reject cancellation by non-owner', async () => {
        // Create another company
        const otherCompany = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'other-company@example.com',
            password: 'TestPassword123!',
            displayName: 'Other Company',
          });

        const response = await request(app)
          .post('/api/payments/subscription/cancel')
          .set('Authorization', `Bearer ${otherCompany.body.accessToken}`)
          .send({
            subscriptionId: subscriptionId,
          })
          .expect(403);

        expect(response.body.error).toContain('permission');

        // Clean up
        await prisma.user.deleteMany({
          where: { email: 'other-company@example.com' },
        });
      });
    });
  });

  describe('Payment History', () => {
    describe('GET /api/payments/history', () => {
      it('should get payment history for company', async () => {
        // Create some test payments
        await prisma.payment.createMany({
          data: [
            {
              companyId: companyId,
              amount: 4990,
              currency: 'CZK',
              type: 'JOB_POSTING',
              status: 'COMPLETED',
              stripePaymentIntentId: 'pi_test_1',
            },
            {
              companyId: companyId,
              amount: 9990,
              currency: 'CZK',
              type: 'JOB_POSTING',
              status: 'COMPLETED',
              stripePaymentIntentId: 'pi_test_2',
            },
          ],
        });

        const response = await request(app)
          .get('/api/payments/history')
          .set('Authorization', `Bearer ${companyToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('payments');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.payments)).toBe(true);
        expect(response.body.payments.length).toBeGreaterThan(0);
      });

      it('should filter payment history by type', async () => {
        const response = await request(app)
          .get('/api/payments/history?type=JOB_POSTING')
          .set('Authorization', `Bearer ${companyToken}`)
          .expect(200);

        expect(response.body.payments.every((p: any) => p.type === 'JOB_POSTING')).toBe(true);
      });

      it('should filter payment history by status', async () => {
        const response = await request(app)
          .get('/api/payments/history?status=COMPLETED')
          .set('Authorization', `Bearer ${companyToken}`)
          .expect(200);

        expect(response.body.payments.every((p: any) => p.status === 'COMPLETED')).toBe(true);
      });

      it('should paginate payment history', async () => {
        const response = await request(app)
          .get('/api/payments/history?limit=5&offset=0')
          .set('Authorization', `Bearer ${companyToken}`)
          .expect(200);

        expect(response.body.pagination).toHaveProperty('limit', 5);
        expect(response.body.pagination).toHaveProperty('offset', 0);
      });
    });
  });

  describe('Stripe Webhook', () => {
    describe('POST /api/webhooks/stripe', () => {
      it('should handle successful payment webhook', async () => {
        const webhookPayload = {
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_webhook_test',
              amount: 4990,
              status: 'succeeded',
            },
          },
        };

        // Note: Real webhook would require Stripe signature
        // This is a simplified test
        const response = await request(app)
          .post('/api/webhooks/stripe')
          .send(webhookPayload)
          .expect(200);

        expect(response.body).toHaveProperty('received', true);
      });

      it('should handle subscription events', async () => {
        const webhookPayload = {
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_webhook_test',
              status: 'active',
            },
          },
        };

        const response = await request(app)
          .post('/api/webhooks/stripe')
          .send(webhookPayload)
          .expect(200);

        expect(response.body).toHaveProperty('received', true);
      });
    });
  });

  describe('Usage Limits', () => {
    it('should track job posting usage', async () => {
      const profile = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(200);

      expect(profile.body).toHaveProperty('jobPostsUsed');
      expect(profile.body).toHaveProperty('jobPostsLimit');
      expect(typeof profile.body.jobPostsUsed).toBe('number');
    });

    it('should track CV view usage', async () => {
      const profile = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(200);

      expect(profile.body).toHaveProperty('cvViewsUsed');
      expect(profile.body).toHaveProperty('cvViewsLimit');
      expect(typeof profile.body.cvViewsUsed).toBe('number');
    });

    it('should prevent job creation when limit reached', async () => {
      // Set usage to limit
      await prisma.user.update({
        where: { id: companyId },
        data: {
          jobPostsUsed: 10,
          jobPostsLimit: 10,
        },
      });

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          title: 'Over Limit Job',
          description: 'This should fail',
        })
        .expect(403);

      expect(response.body.error).toContain('limit');

      // Reset for other tests
      await prisma.user.update({
        where: { id: companyId },
        data: {
          jobPostsUsed: 0,
          jobPostsLimit: 10,
        },
      });
    });
  });
});

import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Security Middleware', () => {
  describe('Rate Limiting', () => {
    it('should have helmet security headers', async () => {
      const response = await request(app).get('/health');

      // Check for security headers set by Helmet
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    it('should enforce rate limits on API', async () => {
      // Make many requests quickly to trigger rate limit
      const promises = Array(101)
        .fill(null)
        .map((_, i) =>
          request(app)
            .get('/health')
            .set('X-Forwarded-For', '192.168.1.100') // Simulate same IP
        );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter((r) => r.status === 429);

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 30000); // Increase timeout for rate limit test
  });

  describe('Admin Middleware', () => {
    let regularUserToken: string;
    let adminUserToken: string;

    const regularUser = {
      email: 'regular-security@example.com',
      password: 'TestPassword123!',
      displayName: 'Regular User',
    };

    const adminUser = {
      email: 'admin-security@example.com',
      password: 'AdminPassword123!',
      displayName: 'Admin User',
    };

    beforeAll(async () => {
      // Clean up
      await prisma.user.deleteMany({
        where: {
          email: { in: [regularUser.email, adminUser.email] },
        },
      });

      // Create regular user
      const regularResponse = await request(app)
        .post('/api/auth/register')
        .send(regularUser);
      regularUserToken = regularResponse.body.accessToken;

      // Create admin user
      const adminResponse = await request(app)
        .post('/api/auth/register')
        .send(adminUser);
      adminUserToken = adminResponse.body.accessToken;

      // Assign ADMIN role
      await prisma.user.update({
        where: { email: adminUser.email },
        data: { roles: ['ADMIN'] },
      });
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: {
          email: { in: [regularUser.email, adminUser.email] },
        },
      });
      await prisma.$disconnect();
    });

    it('should allow admin access with ADMIN role', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
    });

    it('should block regular user from admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.error).toContain('Admin access required');
    });

    it('should block unauthenticated access to admin endpoints', async () => {
      await request(app).get('/api/admin/stats').expect(401);
    });
  });

  describe('Ban Middleware', () => {
    let bannedUserToken: string;
    let bannedUserId: string;

    const bannedUser = {
      email: 'banned-test@example.com',
      password: 'TestPassword123!',
      displayName: 'Banned User',
    };

    beforeAll(async () => {
      // Clean up
      await prisma.user.deleteMany({
        where: { email: bannedUser.email },
      });

      // Create user
      const response = await request(app)
        .post('/api/auth/register')
        .send(bannedUser);
      bannedUserToken = response.body.accessToken;
      bannedUserId = response.body.user.id;
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: bannedUser.email },
      });
      await prisma.$disconnect();
    });

    it('should block banned user from making requests', async () => {
      // Ban the user
      await prisma.user.update({
        where: { id: bannedUserId },
        data: {
          isBanned: true,
          banReason: 'Test ban for security check',
        },
      });

      // Try to access protected endpoint
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .expect(403);

      expect(response.body.error).toContain('banned');
      expect(response.body).toHaveProperty('reason');
    });
  });

  describe('Input Sanitization', () => {
    let userToken: string;

    const testUser = {
      email: 'sanitize-test@example.com',
      password: 'TestPassword123!',
      displayName: 'Sanitize User',
    };

    beforeAll(async () => {
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      userToken = response.body.accessToken;
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
      await prisma.$disconnect();
    });

    it('should sanitize NoSQL injection attempts', async () => {
      // Attempt NoSQL injection in login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $ne: null },
          password: { $ne: null },
        });

      // Should fail gracefully, not process the injection
      expect(response.status).not.toBe(200);
    });

    it('should handle parameter pollution', async () => {
      // HPP protection should handle duplicate parameters
      const response = await request(app)
        .get('/api/posts/feed?limit=10&limit=100&limit=1000')
        .set('Authorization', `Bearer ${userToken}`);

      // Should not crash, HPP picks last or first value
      expect(response.status).not.toBe(500);
    });
  });

  describe('CORS', () => {
    it('should set CORS headers correctly', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Body Size Limits', () => {
    let userToken: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'bodysize-test@example.com',
          password: 'TestPassword123!',
          displayName: 'Body Size User',
        });
      userToken = response.body.accessToken;
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: 'bodysize-test@example.com' },
      });
      await prisma.$disconnect();
    });

    it('should reject oversized request body', async () => {
      // Create a large payload (>10kb limit)
      const largePayload = {
        content: 'x'.repeat(20000), // 20KB of data
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(largePayload);

      expect(response.status).toBe(413); // Payload Too Large
    });
  });
});

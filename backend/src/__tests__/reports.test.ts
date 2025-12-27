import request from 'supertest';
import app from '../app';
import { PrismaClient, Role, ReportType, ReportStatus } from '@prisma/client';

const prisma = new PrismaClient();

describe('Reporting System', () => {
  let userToken: string;
  let userId: string;
  let adminToken: string;
  let reportedUserId: string;
  let reportId: string;

  const testUser = {
    email: 'reporter@example.com',
    password: 'TestPassword123!',
    displayName: 'Reporter User',
  };

  const adminUser = {
    email: 'admin-reports@example.com',
    password: 'AdminPassword123!',
    displayName: 'Admin User',
  };

  const reportedUser = {
    email: 'reported@example.com',
    password: 'TestPassword123!',
    displayName: 'Reported User',
  };

  beforeAll(async () => {
    // Clean up existing test data
    await prisma.report.deleteMany({
      where: {
        OR: [
          { reporter: { email: testUser.email } },
          { reportedUser: { email: reportedUser.email } },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUser.email, adminUser.email, reportedUser.email],
        },
      },
    });

    // Create test users
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    userToken = userResponse.body.accessToken;
    userId = userResponse.body.user.id;

    const reportedResponse = await request(app)
      .post('/api/auth/register')
      .send(reportedUser);
    reportedUserId = reportedResponse.body.user.id;

    // Create admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminUser);
    adminToken = adminResponse.body.accessToken;

    // Make user an admin
    await prisma.user.update({
      where: { email: adminUser.email },
      data: { roles: [Role.ADMIN] },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.report.deleteMany({
      where: {
        OR: [
          { reporterId: userId },
          { reportedUserId: reportedUserId },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUser.email, adminUser.email, reportedUser.email],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('POST /api/reports', () => {
    it('should create a report successfully', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reportedUserId: reportedUserId,
          type: ReportType.SPAM,
          reason: 'This user is posting spam content repeatedly',
          description: 'Detailed description of spam behavior',
          evidence: ['https://example.com/screenshot1.png'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', ReportType.SPAM);
      expect(response.body).toHaveProperty('status', ReportStatus.PENDING);
      expect(response.body.reporter).toHaveProperty('email', testUser.email);
      expect(response.body.reportedUser).toHaveProperty('email', reportedUser.email);

      reportId = response.body.id;
    });

    it('should reject report without authentication', async () => {
      await request(app)
        .post('/api/reports')
        .send({
          reportedUserId: reportedUserId,
          type: ReportType.SPAM,
          reason: 'Spam content',
        })
        .expect(401);
    });

    it('should reject self-reporting', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reportedUserId: userId,
          type: ReportType.SPAM,
          reason: 'Trying to report myself',
        })
        .expect(400);

      expect(response.body.error).toContain('cannot report yourself');
    });

    it('should reject duplicate report', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reportedUserId: reportedUserId,
          type: ReportType.SPAM,
          reason: 'Another spam report',
        })
        .expect(400);

      expect(response.body.error).toContain('already reported');
    });

    it('should reject report with short reason', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reportedUserId: reportedUserId,
          type: ReportType.SPAM,
          reason: 'Short',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject report without reported entity', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: ReportType.SPAM,
          reason: 'Report without target',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/reports/my', () => {
    it('should get user reports', async () => {
      const response = await request(app)
        .get('/api/reports/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('type');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should reject without authentication', async () => {
      await request(app).get('/api/reports/my').expect(401);
    });
  });

  describe('Admin Report Management', () => {
    describe('GET /api/admin/reports', () => {
      it('should get all reports as admin', async () => {
        const response = await request(app)
          .get('/api/admin/reports')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('reports');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.reports)).toBe(true);
      });

      it('should filter reports by status', async () => {
        const response = await request(app)
          .get('/api/admin/reports?status=PENDING')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.reports.every((r: any) => r.status === 'PENDING')).toBe(true);
      });

      it('should filter reports by type', async () => {
        const response = await request(app)
          .get('/api/admin/reports?type=SPAM')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.reports.every((r: any) => r.type === 'SPAM')).toBe(true);
      });

      it('should reject non-admin access', async () => {
        const response = await request(app)
          .get('/api/admin/reports')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.error).toContain('Admin access required');
      });
    });

    describe('GET /api/admin/reports/stats', () => {
      it('should get report statistics', async () => {
        const response = await request(app)
          .get('/api/admin/reports/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('totalReports');
        expect(response.body).toHaveProperty('pendingReports');
        expect(response.body).toHaveProperty('resolvedReports');
        expect(response.body).toHaveProperty('dismissedReports');
        expect(response.body).toHaveProperty('reportsByType');
      });
    });

    describe('GET /api/admin/reports/:reportId', () => {
      it('should get report details', async () => {
        const response = await request(app)
          .get(`/api/admin/reports/${reportId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', reportId);
        expect(response.body).toHaveProperty('reporter');
        expect(response.body).toHaveProperty('reportedUser');
      });

      it('should return 404 for non-existent report', async () => {
        await request(app)
          .get('/api/admin/reports/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('PUT /api/admin/reports/:reportId', () => {
      it('should update report status', async () => {
        const response = await request(app)
          .put(`/api/admin/reports/${reportId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: ReportStatus.REVIEWING,
            reviewNotes: 'Under investigation',
          })
          .expect(200);

        expect(response.body).toHaveProperty('status', ReportStatus.REVIEWING);
        expect(response.body).toHaveProperty('reviewNotes', 'Under investigation');
        expect(response.body).toHaveProperty('reviewedAt');
      });

      it('should resolve report', async () => {
        const response = await request(app)
          .put(`/api/admin/reports/${reportId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: ReportStatus.RESOLVED,
            resolution: 'User has been warned and content removed',
          })
          .expect(200);

        expect(response.body).toHaveProperty('status', ReportStatus.RESOLVED);
        expect(response.body).toHaveProperty('resolution');
      });

      it('should reject invalid status', async () => {
        const response = await request(app)
          .put(`/api/admin/reports/${reportId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'INVALID_STATUS',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });
});

import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Job System', () => {
  let companyToken: string;
  let companyId: string;
  let candidateToken: string;
  let candidateId: string;
  let jobId: string;
  let applicationId: string;

  const companyUser = {
    email: 'company-job@example.com',
    password: 'TestPassword123!',
    displayName: 'Test Company',
  };

  const candidateUser = {
    email: 'candidate-job@example.com',
    password: 'TestPassword123!',
    displayName: 'Test Candidate',
  };

  beforeAll(async () => {
    // Clean up existing data
    await prisma.application.deleteMany({
      where: {
        OR: [
          { applicant: { email: candidateUser.email } },
        ],
      },
    });

    await prisma.job.deleteMany({
      where: { company: { email: companyUser.email } },
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: [companyUser.email, candidateUser.email] },
      },
    });

    // Create company user
    const companyResponse = await request(app)
      .post('/api/auth/register')
      .send(companyUser);
    companyToken = companyResponse.body.accessToken;
    companyId = companyResponse.body.user.id;

    // Set company role
    await prisma.user.update({
      where: { id: companyId },
      data: { roles: ['COMPANY'] },
    });

    // Create candidate user
    const candidateResponse = await request(app)
      .post('/api/auth/register')
      .send(candidateUser);
    candidateToken = candidateResponse.body.accessToken;
    candidateId = candidateResponse.body.user.id;

    // Set candidate role
    await prisma.user.update({
      where: { id: candidateId },
      data: { roles: ['CANDIDATE'] },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.application.deleteMany({
      where: {
        OR: [
          { applicantId: candidateId },
        ],
      },
    });

    await prisma.job.deleteMany({
      where: { companyId: companyId },
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: [companyUser.email, candidateUser.email] },
      },
    });

    await prisma.$disconnect();
  });

  describe('POST /api/jobs', () => {
    it('should create a job successfully', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          title: 'Senior Software Engineer',
          description: 'We are looking for a senior software engineer...',
          location: 'Prague, Czech Republic',
          employmentType: 'FULL_TIME',
          salaryMin: 80000,
          salaryMax: 120000,
          salaryCurrency: 'CZK',
          requirements: ['5+ years experience', 'TypeScript', 'React'],
          benefits: ['Remote work', 'Flexible hours'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Senior Software Engineer');
      expect(response.body).toHaveProperty('status', 'OPEN');
      expect(response.body.company).toHaveProperty('id', companyId);

      jobId = response.body.id;
    });

    it('should reject job creation without authentication', async () => {
      await request(app)
        .post('/api/jobs')
        .send({
          title: 'Test Job',
          description: 'Test description',
        })
        .expect(401);
    });

    it('should reject job creation with invalid data', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          title: 'ab', // Too short
          description: 'short',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/jobs', () => {
    it('should get job listings with pagination', async () => {
      const response = await request(app)
        .get('/api/jobs?limit=10&offset=0')
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.jobs)).toBe(true);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('hasMore');
    });

    it('should filter jobs by location', async () => {
      const response = await request(app)
        .get('/api/jobs?location=Prague')
        .expect(200);

      expect(response.body.jobs.every((job: any) =>
        job.location.includes('Prague')
      )).toBe(true);
    });

    it('should filter jobs by employment type', async () => {
      const response = await request(app)
        .get('/api/jobs?employmentType=FULL_TIME')
        .expect(200);

      expect(response.body.jobs.every((job: any) =>
        job.employmentType === 'FULL_TIME'
      )).toBe(true);
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should get job details', async () => {
      const response = await request(app)
        .get(`/api/jobs/${jobId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', jobId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('company');
    });

    it('should return 404 for non-existent job', async () => {
      await request(app)
        .get('/api/jobs/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/jobs/:id', () => {
    it('should update job as owner', async () => {
      const response = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          title: 'Senior Software Engineer - Updated',
          salaryMin: 90000,
        })
        .expect(200);

      expect(response.body).toHaveProperty('title', 'Senior Software Engineer - Updated');
      expect(response.body).toHaveProperty('salaryMin', 90000);
    });

    it('should reject update by non-owner', async () => {
      const response = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          title: 'Hacked Job Title',
        })
        .expect(403);

      expect(response.body.error).toContain('permission');
    });
  });

  describe('Job Applications', () => {
    describe('POST /api/jobs/:id/apply', () => {
      it('should apply to job successfully', async () => {
        const response = await request(app)
          .post(`/api/jobs/${jobId}/apply`)
          .set('Authorization', `Bearer ${candidateToken}`)
          .send({
            coverLetter: 'I am very interested in this position...',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('status', 'NEW');
        expect(response.body).toHaveProperty('jobId', jobId);
        expect(response.body.applicant).toHaveProperty('id', candidateId);

        applicationId = response.body.id;
      });

      it('should reject duplicate application', async () => {
        const response = await request(app)
          .post(`/api/jobs/${jobId}/apply`)
          .set('Authorization', `Bearer ${candidateToken}`)
          .send({
            coverLetter: 'Another application',
          })
          .expect(400);

        expect(response.body.error).toContain('already applied');
      });

      it('should reject application without authentication', async () => {
        await request(app)
          .post(`/api/jobs/${jobId}/apply`)
          .send({
            coverLetter: 'Test',
          })
          .expect(401);
      });
    });

    describe('GET /api/jobs/:id/applications', () => {
      it('should get job applications as company owner', async () => {
        const response = await request(app)
          .get(`/api/jobs/${jobId}/applications`)
          .set('Authorization', `Bearer ${companyToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('applicant');
      });

      it('should reject getting applications as non-owner', async () => {
        const response = await request(app)
          .get(`/api/jobs/${jobId}/applications`)
          .set('Authorization', `Bearer ${candidateToken}`)
          .expect(403);

        expect(response.body.error).toContain('permission');
      });
    });

    describe('PUT /api/applications/:id/status', () => {
      it('should update application status as company', async () => {
        const response = await request(app)
          .put(`/api/applications/${applicationId}/status`)
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            status: 'VIEWED',
          })
          .expect(200);

        expect(response.body).toHaveProperty('status', 'VIEWED');
      });

      it('should progress application to interview', async () => {
        const response = await request(app)
          .put(`/api/applications/${applicationId}/status`)
          .set('Authorization', `Bearer ${companyToken}`)
          .send({
            status: 'INTERVIEW',
            notes: 'Scheduled for next week',
          })
          .expect(200);

        expect(response.body).toHaveProperty('status', 'INTERVIEW');
      });

      it('should reject status update by non-company user', async () => {
        const response = await request(app)
          .put(`/api/applications/${applicationId}/status`)
          .set('Authorization', `Bearer ${candidateToken}`)
          .send({
            status: 'HIRED',
          })
          .expect(403);

        expect(response.body.error).toContain('permission');
      });
    });

    describe('GET /api/applications/my', () => {
      it('should get user applications', async () => {
        const response = await request(app)
          .get('/api/applications/my')
          .set('Authorization', `Bearer ${candidateToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('job');
      });

      it('should reject without authentication', async () => {
        await request(app)
          .get('/api/applications/my')
          .expect(401);
      });
    });
  });

  describe('Job Status Management', () => {
    it('should close job', async () => {
      const response = await request(app)
        .put(`/api/jobs/${jobId}/status`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          status: 'CLOSED',
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'CLOSED');
    });

    it('should reopen job', async () => {
      const response = await request(app)
        .put(`/api/jobs/${jobId}/status`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          status: 'OPEN',
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OPEN');
    });
  });

  describe('Saved Jobs', () => {
    it('should save a job', async () => {
      const response = await request(app)
        .post(`/api/jobs/${jobId}/save`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('saved', true);
    });

    it('should unsave a job', async () => {
      const response = await request(app)
        .post(`/api/jobs/${jobId}/save`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('saved', false);
    });

    it('should get saved jobs', async () => {
      // Save it again
      await request(app)
        .post(`/api/jobs/${jobId}/save`)
        .set('Authorization', `Bearer ${candidateToken}`);

      const response = await request(app)
        .get('/api/jobs/saved')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

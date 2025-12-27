import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User Profile', () => {
  let userToken: string;
  let userId: string;
  let experienceId: string;
  let skillId: string;

  const testUser = {
    email: 'profile-test@example.com',
    password: 'TestPassword123!',
    displayName: 'Profile Test User',
  };

  beforeAll(async () => {
    // Clean up
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    // Create user
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    userToken = response.body.accessToken;
    userId = response.body.user.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/users/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should reject without authentication', async () => {
      await request(app)
        .get('/api/users/me')
        .expect(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user profile by id', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('displayName', testUser.displayName);
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('email'); // Email private for other users
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          displayName: 'Updated Display Name',
          bio: 'This is my updated bio',
          location: 'Prague, Czech Republic',
          website: 'https://example.com',
        })
        .expect(200);

      expect(response.body).toHaveProperty('displayName', 'Updated Display Name');
      expect(response.body).toHaveProperty('bio', 'This is my updated bio');
      expect(response.body).toHaveProperty('location', 'Prague, Czech Republic');
    });

    it('should reject invalid website URL', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          website: 'not-a-url',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Skills Management', () => {
    describe('POST /api/users/me/skills', () => {
      it('should add a skill', async () => {
        const response = await request(app)
          .post('/api/users/me/skills')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: 'TypeScript',
            level: 'EXPERT',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name', 'TypeScript');
        expect(response.body).toHaveProperty('level', 'EXPERT');

        skillId = response.body.id;
      });

      it('should reject duplicate skill', async () => {
        const response = await request(app)
          .post('/api/users/me/skills')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: 'TypeScript',
          })
          .expect(400);

        expect(response.body.error).toContain('already exists');
      });
    });

    describe('DELETE /api/users/me/skills/:id', () => {
      it('should remove a skill', async () => {
        await request(app)
          .delete(`/api/users/me/skills/${skillId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        // Verify it's deleted
        const profile = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${userToken}`);

        const hasSkill = profile.body.skills?.some((s: any) => s.id === skillId);
        expect(hasSkill).toBeFalsy();
      });
    });
  });

  describe('Experience Management', () => {
    describe('POST /api/users/me/experience', () => {
      it('should add work experience', async () => {
        const response = await request(app)
          .post('/api/users/me/experience')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Senior Developer',
            company: 'Tech Corp',
            location: 'Prague',
            startDate: '2020-01-01',
            endDate: '2023-12-31',
            current: false,
            description: 'Worked on various projects...',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('title', 'Senior Developer');
        expect(response.body).toHaveProperty('company', 'Tech Corp');

        experienceId = response.body.id;
      });

      it('should add current position', async () => {
        const response = await request(app)
          .post('/api/users/me/experience')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Lead Developer',
            company: 'New Company',
            startDate: '2024-01-01',
            current: true,
            description: 'Current role',
          })
          .expect(201);

        expect(response.body).toHaveProperty('current', true);
        expect(response.body.endDate).toBeNull();
      });

      it('should reject invalid dates', async () => {
        const response = await request(app)
          .post('/api/users/me/experience')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Test Role',
            company: 'Test Company',
            startDate: '2024-01-01',
            endDate: '2023-01-01', // End before start
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('PUT /api/users/me/experience/:id', () => {
      it('should update work experience', async () => {
        const response = await request(app)
          .put(`/api/users/me/experience/${experienceId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Senior Software Engineer',
            description: 'Updated description',
          })
          .expect(200);

        expect(response.body).toHaveProperty('title', 'Senior Software Engineer');
        expect(response.body).toHaveProperty('description', 'Updated description');
      });
    });

    describe('DELETE /api/users/me/experience/:id', () => {
      it('should delete work experience', async () => {
        await request(app)
          .delete(`/api/users/me/experience/${experienceId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        // Verify it's deleted
        const profile = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${userToken}`);

        const hasExperience = profile.body.experience?.some((e: any) => e.id === experienceId);
        expect(hasExperience).toBeFalsy();
      });
    });
  });

  describe('Education Management', () => {
    let educationId: string;

    it('should add education', async () => {
      const response = await request(app)
        .post('/api/users/me/education')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          school: 'Charles University',
          degree: 'Master of Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2015-09-01',
          endDate: '2017-06-30',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('school', 'Charles University');
      expect(response.body).toHaveProperty('degree', 'Master of Science');

      educationId = response.body.id;
    });

    it('should update education', async () => {
      const response = await request(app)
        .put(`/api/users/me/education/${educationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          grade: 'Summa Cum Laude',
        })
        .expect(200);

      expect(response.body).toHaveProperty('grade', 'Summa Cum Laude');
    });

    it('should delete education', async () => {
      await request(app)
        .delete(`/api/users/me/education/${educationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });
  });

  describe('User Search', () => {
    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/users/search?query=Profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should search users by skills', async () => {
      // Add a skill first
      await request(app)
        .post('/api/users/me/skills')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'React' });

      const response = await request(app)
        .get('/api/users/search?skills=React')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by role', async () => {
      const response = await request(app)
        .get('/api/users/search?role=CANDIDATE')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Onboarding', () => {
    let newUserToken: string;

    beforeAll(async () => {
      // Create new user for onboarding test
      await prisma.user.deleteMany({
        where: { email: 'onboarding@example.com' },
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'onboarding@example.com',
          password: 'TestPassword123!',
          displayName: 'Onboarding User',
        });
      newUserToken = response.body.accessToken;
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: 'onboarding@example.com' },
      });
    });

    it('should complete onboarding', async () => {
      const response = await request(app)
        .post('/api/users/onboarding')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          roles: ['CANDIDATE'],
          bio: 'Looking for new opportunities',
          location: 'Brno, Czech Republic',
          skills: ['JavaScript', 'Node.js', 'React'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('onboardingCompleted', true);
      expect(response.body.roles).toContain('CANDIDATE');
    });
  });
});

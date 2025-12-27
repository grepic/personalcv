import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Social Features', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let postId: string;
  let commentId: string;
  let connectionId: string;

  const user1 = {
    email: 'social-user1@example.com',
    password: 'TestPassword123!',
    displayName: 'Social User 1',
  };

  const user2 = {
    email: 'social-user2@example.com',
    password: 'TestPassword123!',
    displayName: 'Social User 2',
  };

  beforeAll(async () => {
    // Clean up existing data
    await prisma.comment.deleteMany({
      where: {
        OR: [
          { author: { email: { in: [user1.email, user2.email] } } },
        ],
      },
    });

    await prisma.post.deleteMany({
      where: { author: { email: { in: [user1.email, user2.email] } } },
    });

    await prisma.connection.deleteMany({
      where: {
        OR: [
          { requester: { email: { in: [user1.email, user2.email] } } },
          { receiver: { email: { in: [user1.email, user2.email] } } },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: { email: { in: [user1.email, user2.email] } },
    });

    // Create users
    const response1 = await request(app)
      .post('/api/auth/register')
      .send(user1);
    user1Token = response1.body.accessToken;
    user1Id = response1.body.user.id;

    const response2 = await request(app)
      .post('/api/auth/register')
      .send(user2);
    user2Token = response2.body.accessToken;
    user2Id = response2.body.user.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.comment.deleteMany({
      where: {
        OR: [
          { authorId: user1Id },
          { authorId: user2Id },
        ],
      },
    });

    await prisma.reaction.deleteMany({
      where: { userId: { in: [user1Id, user2Id] } },
    });

    await prisma.post.deleteMany({
      where: { authorId: { in: [user1Id, user2Id] } },
    });

    await prisma.connection.deleteMany({
      where: {
        OR: [
          { requesterId: user1Id },
          { receiverId: user1Id },
          { requesterId: user2Id },
          { receiverId: user2Id },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: { email: { in: [user1.email, user2.email] } },
    });

    await prisma.$disconnect();
  });

  describe('Connections', () => {
    describe('POST /api/connections/request', () => {
      it('should send connection request', async () => {
        const response = await request(app)
          .post('/api/connections/request')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            receiverId: user2Id,
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('status', 'PENDING');
        expect(response.body.requester).toHaveProperty('id', user1Id);
        expect(response.body.receiver).toHaveProperty('id', user2Id);

        connectionId = response.body.id;
      });

      it('should reject duplicate connection request', async () => {
        const response = await request(app)
          .post('/api/connections/request')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            receiverId: user2Id,
          })
          .expect(400);

        expect(response.body.error).toContain('already exists');
      });

      it('should reject self-connection', async () => {
        const response = await request(app)
          .post('/api/connections/request')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            receiverId: user1Id,
          })
          .expect(400);

        expect(response.body.error).toContain('cannot connect');
      });
    });

    describe('GET /api/connections/pending', () => {
      it('should get pending connection requests', async () => {
        const response = await request(app)
          .get('/api/connections/pending')
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].requester).toHaveProperty('id', user1Id);
      });
    });

    describe('POST /api/connections/:id/accept', () => {
      it('should accept connection request', async () => {
        const response = await request(app)
          .post(`/api/connections/${connectionId}/accept`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(200);

        expect(response.body).toHaveProperty('status', 'ACCEPTED');
      });

      it('should reject acceptance by non-receiver', async () => {
        // Create another connection
        const newConn = await prisma.connection.create({
          data: {
            requesterId: user1Id,
            receiverId: user2Id,
            status: 'PENDING',
          },
        });

        const response = await request(app)
          .post(`/api/connections/${newConn.id}/accept`)
          .set('Authorization', `Bearer ${user1Token}`) // Wrong user
          .expect(403);

        expect(response.body.error).toContain('permission');

        // Clean up
        await prisma.connection.delete({ where: { id: newConn.id } });
      });
    });

    describe('GET /api/connections', () => {
      it('should get user connections', async () => {
        const response = await request(app)
          .get('/api/connections')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('status', 'ACCEPTED');
      });
    });

    describe('DELETE /api/connections/:id', () => {
      it('should remove connection', async () => {
        await request(app)
          .delete(`/api/connections/${connectionId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        // Verify it's deleted
        const connections = await request(app)
          .get('/api/connections')
          .set('Authorization', `Bearer ${user1Token}`);

        const hasConnection = connections.body.some((c: any) => c.id === connectionId);
        expect(hasConnection).toBeFalsy();
      });
    });
  });

  describe('Posts', () => {
    describe('POST /api/posts', () => {
      it('should create a status post', async () => {
        const response = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            type: 'STATUS',
            content: 'This is my first post!',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('type', 'STATUS');
        expect(response.body).toHaveProperty('content', 'This is my first post!');
        expect(response.body.author).toHaveProperty('id', user1Id);

        postId = response.body.id;
      });

      it('should create a portfolio post with images', async () => {
        const response = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            type: 'PORTFOLIO',
            content: 'Check out my latest project',
            media: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
          })
          .expect(201);

        expect(response.body).toHaveProperty('type', 'PORTFOLIO');
        expect(response.body.media).toHaveLength(2);
      });

      it('should reject post with empty content', async () => {
        const response = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            type: 'STATUS',
            content: '',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/posts/feed', () => {
      it('should get user feed', async () => {
        const response = await request(app)
          .get('/api/posts/feed')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toHaveProperty('posts');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.posts)).toBe(true);
      });

      it('should paginate feed results', async () => {
        const response = await request(app)
          .get('/api/posts/feed?limit=5&offset=0')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body.pagination).toHaveProperty('limit', 5);
        expect(response.body.pagination).toHaveProperty('offset', 0);
      });
    });

    describe('GET /api/posts/:id', () => {
      it('should get post details', async () => {
        const response = await request(app)
          .get(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', postId);
        expect(response.body).toHaveProperty('author');
        expect(response.body).toHaveProperty('_count');
      });

      it('should return 404 for non-existent post', async () => {
        await request(app)
          .get('/api/posts/non-existent-id')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(404);
      });
    });

    describe('PUT /api/posts/:id', () => {
      it('should update own post', async () => {
        const response = await request(app)
          .put(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            content: 'Updated post content',
          })
          .expect(200);

        expect(response.body).toHaveProperty('content', 'Updated post content');
      });

      it('should reject update by non-author', async () => {
        const response = await request(app)
          .put(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            content: 'Hacked content',
          })
          .expect(403);

        expect(response.body.error).toContain('permission');
      });
    });

    describe('DELETE /api/posts/:id', () => {
      it('should reject delete by non-author', async () => {
        const response = await request(app)
          .delete(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(403);

        expect(response.body.error).toContain('permission');
      });

      it('should delete own post', async () => {
        await request(app)
          .delete(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        // Create a new post for comment tests
        const newPost = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            type: 'STATUS',
            content: 'Post for comment tests',
          });
        postId = newPost.body.id;
      });
    });
  });

  describe('Comments', () => {
    describe('POST /api/posts/:id/comments', () => {
      it('should create a comment', async () => {
        const response = await request(app)
          .post(`/api/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            content: 'Great post!',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('content', 'Great post!');
        expect(response.body.author).toHaveProperty('id', user2Id);

        commentId = response.body.id;
      });

      it('should reject empty comment', async () => {
        const response = await request(app)
          .post(`/api/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            content: '',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/posts/:id/comments', () => {
      it('should get post comments', async () => {
        const response = await request(app)
          .get(`/api/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('author');
      });
    });

    describe('DELETE /api/comments/:id', () => {
      it('should delete own comment', async () => {
        await request(app)
          .delete(`/api/comments/${commentId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(200);
      });
    });
  });

  describe('Reactions', () => {
    describe('POST /api/posts/:id/react', () => {
      it('should add reaction to post', async () => {
        const response = await request(app)
          .post(`/api/posts/${postId}/react`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            type: 'LIKE',
          })
          .expect(200);

        expect(response.body).toHaveProperty('reacted', true);
      });

      it('should remove reaction when toggled', async () => {
        const response = await request(app)
          .post(`/api/posts/${postId}/react`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            type: 'LIKE',
          })
          .expect(200);

        expect(response.body).toHaveProperty('reacted', false);
      });

      it('should change reaction type', async () => {
        // Add LIKE
        await request(app)
          .post(`/api/posts/${postId}/react`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            type: 'LIKE',
          });

        // Change to LOVE
        const response = await request(app)
          .post(`/api/posts/${postId}/react`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            type: 'LOVE',
          })
          .expect(200);

        expect(response.body).toHaveProperty('reacted', true);
      });
    });

    describe('GET /api/posts/:id/reactions', () => {
      it('should get post reactions', async () => {
        const response = await request(app)
          .get(`/api/posts/${postId}/reactions`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toHaveProperty('reactions');
        expect(response.body).toHaveProperty('summary');
      });
    });
  });

  describe('Following Companies', () => {
    let companyToken: string;
    let companyId: string;

    beforeAll(async () => {
      // Create company user
      await prisma.user.deleteMany({
        where: { email: 'company-social@example.com' },
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'company-social@example.com',
          password: 'TestPassword123!',
          displayName: 'Test Company',
        });
      companyToken = response.body.accessToken;
      companyId = response.body.user.id;

      await prisma.user.update({
        where: { id: companyId },
        data: { roles: ['COMPANY'] },
      });
    });

    afterAll(async () => {
      await prisma.follow.deleteMany({
        where: { companyId: companyId },
      });

      await prisma.user.deleteMany({
        where: { email: 'company-social@example.com' },
      });
    });

    it('should follow a company', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('following', true);
    });

    it('should unfollow a company', async () => {
      const response = await request(app)
        .post(`/api/companies/${companyId}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('following', false);
    });

    it('should get followed companies', async () => {
      // Follow again
      await request(app)
        .post(`/api/companies/${companyId}/follow`)
        .set('Authorization', `Bearer ${user1Token}`);

      const response = await request(app)
        .get('/api/companies/following')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

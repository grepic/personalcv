"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeed = getFeed;
exports.createPost = createPost;
exports.getPost = getPost;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const createPostSchema = zod_1.z.object({
    type: zod_1.z.enum([client_1.PostType.STATUS, client_1.PostType.PORTFOLIO]),
    title: zod_1.z.string().optional(),
    content: zod_1.z.string(),
    mediaUrls: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    visibility: zod_1.z.enum(['public', 'followers_only']).optional(),
});
async function getFeed(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { type, limit = '20', offset = '0' } = req.query;
        const where = {};
        if (type) {
            where.type = type;
        }
        // Get posts from:
        // 1. Users the current user follows (companies)
        // 2. Public posts
        // 3. Current user's own posts
        const followedCompanies = await prisma_1.default.userFollowCompany.findMany({
            where: { userId: req.user.userId },
            select: { companyId: true },
        });
        const followedCompanyIds = followedCompanies.map(fc => fc.companyId);
        where.OR = [
            { authorId: { in: followedCompanyIds } },
            { visibility: 'public' },
            { authorId: req.user.userId },
        ];
        const posts = await prisma_1.default.post.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        headline: true,
                        avatarUrl: true,
                        roles: true,
                        companyName: true,
                    },
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        isRemote: true,
                        employmentType: true,
                        salaryMin: true,
                        salaryMax: true,
                        currency: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        res.json({ posts });
    }
    catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function createPost(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const data = createPostSchema.parse(req.body);
        const post = await prisma_1.default.post.create({
            data: {
                authorId: req.user.userId,
                type: data.type,
                title: data.title,
                content: data.content,
                mediaUrls: data.mediaUrls || [],
                tags: data.tags || [],
                visibility: data.visibility || 'public',
            },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        headline: true,
                        avatarUrl: true,
                        roles: true,
                    },
                },
            },
        });
        res.status(201).json({ post });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getPost(req, res) {
    try {
        const { postId } = req.params;
        const post = await prisma_1.default.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        headline: true,
                        avatarUrl: true,
                        roles: true,
                        companyName: true,
                    },
                },
                job: true,
            },
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ post });
    }
    catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=post.controller.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecommendation = createRecommendation;
exports.getUserRecommendations = getUserRecommendations;
exports.updateRecommendation = updateRecommendation;
exports.deleteRecommendation = deleteRecommendation;
exports.toggleRecommendationVisibility = toggleRecommendationVisibility;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const createRecommendationSchema = zod_1.z.object({
    recipientId: zod_1.z.string(),
    relationship: zod_1.z.string().min(1).max(100),
    position: zod_1.z.string().max(200).optional(),
    content: zod_1.z.string().min(10),
});
async function createRecommendation(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const data = createRecommendationSchema.parse(req.body);
        // Check if user already gave a recommendation to this person
        const existing = await prisma_1.default.recommendation.findUnique({
            where: {
                recipientId_authorId: {
                    recipientId: data.recipientId,
                    authorId: req.user.userId,
                },
            },
        });
        if (existing) {
            return res.status(400).json({ error: 'You have already recommended this person' });
        }
        // Create recommendation
        const recommendation = await prisma_1.default.recommendation.create({
            data: {
                recipientId: data.recipientId,
                authorId: req.user.userId,
                relationship: data.relationship,
                position: data.position,
                content: data.content,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                        companyName: true,
                        headline: true,
                        roles: true,
                    },
                },
            },
        });
        res.status(201).json({ recommendation });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create recommendation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getUserRecommendations(req, res) {
    try {
        const { userId } = req.params;
        const recommendations = await prisma_1.default.recommendation.findMany({
            where: {
                recipientId: userId,
                isVisible: true,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                        companyName: true,
                        headline: true,
                        roles: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ recommendations });
    }
    catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateRecommendation(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { recommendationId } = req.params;
        // Check if user owns this recommendation
        const existing = await prisma_1.default.recommendation.findUnique({
            where: { id: recommendationId },
        });
        if (!existing || existing.authorId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const data = createRecommendationSchema.partial().parse(req.body);
        const recommendation = await prisma_1.default.recommendation.update({
            where: { id: recommendationId },
            data: {
                relationship: data.relationship,
                position: data.position,
                content: data.content,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                        companyName: true,
                        headline: true,
                        roles: true,
                    },
                },
            },
        });
        res.json({ recommendation });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Update recommendation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteRecommendation(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { recommendationId } = req.params;
        // Check if user owns this recommendation
        const existing = await prisma_1.default.recommendation.findUnique({
            where: { id: recommendationId },
        });
        if (!existing || existing.authorId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await prisma_1.default.recommendation.delete({
            where: { id: recommendationId },
        });
        res.json({ message: 'Recommendation deleted' });
    }
    catch (error) {
        console.error('Delete recommendation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function toggleRecommendationVisibility(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { recommendationId } = req.params;
        // Check if user is the recipient (can hide/show recommendations they received)
        const existing = await prisma_1.default.recommendation.findUnique({
            where: { id: recommendationId },
        });
        if (!existing || existing.recipientId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const recommendation = await prisma_1.default.recommendation.update({
            where: { id: recommendationId },
            data: { isVisible: !existing.isVisible },
        });
        res.json({ recommendation });
    }
    catch (error) {
        console.error('Toggle recommendation visibility error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=recommendation.controller.js.map
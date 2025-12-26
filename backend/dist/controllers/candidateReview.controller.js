"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCandidateReview = createCandidateReview;
exports.getCandidateReviews = getCandidateReviews;
exports.updateCandidateReview = updateCandidateReview;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const createReviewSchema = zod_1.z.object({
    jobId: zod_1.z.string().optional(),
    round: zod_1.z.number().int().positive(),
    title: zod_1.z.string(),
    hardSkills: zod_1.z.number().int().min(1).max(5).optional(),
    softSkills: zod_1.z.number().int().min(1).max(5).optional(),
    language: zod_1.z.number().int().min(1).max(5).optional(),
    cultureFit: zod_1.z.number().int().min(1).max(5).optional(),
    overallRecommendation: zod_1.z.enum([
        client_1.Recommendation.STRONG_HIRE,
        client_1.Recommendation.HIRE,
        client_1.Recommendation.NEUTRAL,
        client_1.Recommendation.NO_HIRE,
    ]),
    summary: zod_1.z.string(),
});
async function createCandidateReview(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // Check if user is a company
        if (!req.user.roles.includes(client_1.Role.COMPANY)) {
            return res.status(403).json({ error: 'Only companies can create reviews' });
        }
        const { candidateId } = req.params;
        const data = createReviewSchema.parse(req.body);
        // Get current user's company ID
        const currentUser = await prisma_1.default.user.findUnique({
            where: { id: req.user.userId },
            select: { companyName: true },
        });
        const review = await prisma_1.default.candidateReview.create({
            data: {
                candidateId,
                companyId: req.user.userId,
                authorId: req.user.userId,
                jobId: data.jobId,
                round: data.round,
                title: data.title,
                hardSkills: data.hardSkills,
                softSkills: data.softSkills,
                language: data.language,
                cultureFit: data.cultureFit,
                overallRecommendation: data.overallRecommendation,
                summary: data.summary,
            },
        });
        res.status(201).json({ review });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create candidate review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getCandidateReviews(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { candidateId } = req.params;
        const { companyId, jobId } = req.query;
        // Check if user is part of the company requesting reviews
        if (companyId && companyId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const where = {
            candidateId,
            companyId: companyId || req.user.userId,
        };
        if (jobId) {
            where.jobId = jobId;
        }
        const reviews = await prisma_1.default.candidateReview.findMany({
            where,
            orderBy: [
                { round: 'asc' },
                { createdAt: 'desc' },
            ],
        });
        res.json({ reviews });
    }
    catch (error) {
        console.error('Get candidate reviews error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateCandidateReview(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { reviewId } = req.params;
        // Check if user is the author
        const existing = await prisma_1.default.candidateReview.findUnique({
            where: { id: reviewId },
        });
        if (!existing || existing.authorId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const review = await prisma_1.default.candidateReview.update({
            where: { id: reviewId },
            data: req.body,
        });
        res.json({ review });
    }
    catch (error) {
        console.error('Update candidate review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=candidateReview.controller.js.map
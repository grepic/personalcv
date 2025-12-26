"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompanyReview = createCompanyReview;
exports.getCompanyReviews = getCompanyReviews;
exports.updateCompanyReview = updateCompanyReview;
exports.deleteCompanyReview = deleteCompanyReview;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const createReviewSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1).max(5),
    title: zod_1.z.string().min(1).max(100),
    content: zod_1.z.string().min(10),
    pros: zod_1.z.string().optional(),
    cons: zod_1.z.string().optional(),
    isVerifiedEmployee: zod_1.z.boolean().optional(),
});
async function createCompanyReview(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { companyId } = req.params;
        const data = createReviewSchema.parse(req.body);
        // Check if company exists and is actually a company
        const company = await prisma_1.default.user.findUnique({
            where: { id: companyId },
        });
        if (!company || !company.roles.includes('COMPANY')) {
            return res.status(404).json({ error: 'Company not found' });
        }
        // Check if user already reviewed this company
        const existing = await prisma_1.default.companyReview.findUnique({
            where: {
                companyId_authorId: {
                    companyId,
                    authorId: req.user.userId,
                },
            },
        });
        if (existing) {
            return res.status(400).json({ error: 'You have already reviewed this company' });
        }
        const review = await prisma_1.default.companyReview.create({
            data: {
                companyId,
                authorId: req.user.userId,
                rating: data.rating,
                title: data.title,
                content: data.content,
                pros: data.pros,
                cons: data.cons,
                isVerifiedEmployee: data.isVerifiedEmployee || false,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                        headline: true,
                    },
                },
            },
        });
        res.status(201).json({ review });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create company review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getCompanyReviews(req, res) {
    try {
        const { companyId } = req.params;
        const { limit = '20', offset = '0' } = req.query;
        const reviews = await prisma_1.default.companyReview.findMany({
            where: { companyId },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                        headline: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const stats = await prisma_1.default.companyReview.groupBy({
            by: ['companyId'],
            where: { companyId },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const averageRating = stats[0]?._avg.rating || 0;
        const totalReviews = stats[0]?._count.rating || 0;
        // Get rating distribution
        const distribution = await prisma_1.default.companyReview.groupBy({
            by: ['rating'],
            where: { companyId },
            _count: { rating: true },
        });
        const ratingDistribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
        };
        distribution.forEach((item) => {
            ratingDistribution[item.rating] = item._count.rating;
        });
        res.json({
            reviews,
            stats: {
                averageRating: Math.round(averageRating * 10) / 10,
                totalReviews,
                ratingDistribution,
            },
        });
    }
    catch (error) {
        console.error('Get company reviews error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateCompanyReview(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { reviewId } = req.params;
        // Check if user is the author
        const existing = await prisma_1.default.companyReview.findUnique({
            where: { id: reviewId },
        });
        if (!existing || existing.authorId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const data = createReviewSchema.parse(req.body);
        const review = await prisma_1.default.companyReview.update({
            where: { id: reviewId },
            data: {
                rating: data.rating,
                title: data.title,
                content: data.content,
                pros: data.pros,
                cons: data.cons,
                isVerifiedEmployee: data.isVerifiedEmployee,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                        headline: true,
                    },
                },
            },
        });
        res.json({ review });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Update company review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteCompanyReview(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { reviewId } = req.params;
        // Check if user is the author
        const existing = await prisma_1.default.companyReview.findUnique({
            where: { id: reviewId },
        });
        if (!existing || existing.authorId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await prisma_1.default.companyReview.delete({
            where: { id: reviewId },
        });
        res.json({ message: 'Review deleted' });
    }
    catch (error) {
        console.error('Delete company review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=companyReview.controller.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCandidateComment = createCandidateComment;
exports.getCandidateComments = getCandidateComments;
exports.updateCandidateComment = updateCandidateComment;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const createCommentSchema = zod_1.z.object({
    jobId: zod_1.z.string().optional(),
    anchorType: zod_1.z.enum([
        client_1.CommentAnchorType.EXPERIENCE,
        client_1.CommentAnchorType.EDUCATION,
        client_1.CommentAnchorType.SKILL,
        client_1.CommentAnchorType.PROJECT,
        client_1.CommentAnchorType.GENERAL,
    ]),
    anchorId: zod_1.z.string().optional(),
    text: zod_1.z.string(),
    parentCommentId: zod_1.z.string().optional(),
});
async function createCandidateComment(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // Check if user is a company
        if (!req.user.roles.includes(client_1.Role.COMPANY)) {
            return res.status(403).json({ error: 'Only companies can create comments' });
        }
        const { candidateId } = req.params;
        const data = createCommentSchema.parse(req.body);
        const comment = await prisma_1.default.candidateComment.create({
            data: {
                candidateId,
                companyId: req.user.userId,
                authorId: req.user.userId,
                jobId: data.jobId,
                anchorType: data.anchorType,
                anchorId: data.anchorId,
                text: data.text,
                parentCommentId: data.parentCommentId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        // Check for mentions (@username) and create notifications
        // Note: This is a simplified implementation
        const mentionRegex = /@(\w+)/g;
        const mentions = data.text.match(mentionRegex);
        if (mentions) {
            // Find users mentioned and create notifications
            // This would require a more sophisticated implementation
            // For now, we'll skip this part
        }
        res.status(201).json({ comment });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create candidate comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getCandidateComments(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { candidateId } = req.params;
        const { companyId, jobId } = req.query;
        // Check if user is part of the company requesting comments
        if (companyId && companyId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const where = {
            candidateId,
            companyId: companyId || req.user.userId,
            parentCommentId: null, // Only get top-level comments
        };
        if (jobId) {
            where.jobId = jobId;
        }
        const comments = await prisma_1.default.candidateComment.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                replies: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ comments });
    }
    catch (error) {
        console.error('Get candidate comments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateCandidateComment(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { commentId } = req.params;
        const { text, resolved, resolvedBy } = req.body;
        // Check authorization
        const existing = await prisma_1.default.candidateComment.findUnique({
            where: { id: commentId },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        // User must be either the author or part of the same company
        if (existing.authorId !== req.user.userId && existing.companyId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const updateData = {};
        if (text !== undefined) {
            // Only author can edit text
            if (existing.authorId !== req.user.userId) {
                return res.status(403).json({ error: 'Only author can edit text' });
            }
            updateData.text = text;
        }
        if (resolved !== undefined) {
            updateData.resolved = resolved;
            if (resolved) {
                updateData.resolvedBy = req.user.userId;
                updateData.resolvedAt = new Date();
            }
            else {
                updateData.resolvedBy = null;
                updateData.resolvedAt = null;
            }
        }
        const comment = await prisma_1.default.candidateComment.update({
            where: { id: commentId },
            data: updateData,
        });
        res.json({ comment });
    }
    catch (error) {
        console.error('Update candidate comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=candidateComment.controller.js.map
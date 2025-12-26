"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPortfolioProject = createPortfolioProject;
exports.getUserPortfolioProjects = getUserPortfolioProjects;
exports.updatePortfolioProject = updatePortfolioProject;
exports.deletePortfolioProject = deletePortfolioProject;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1),
    mediaUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
    externalUrl: zod_1.z.string().url().optional(),
});
async function createPortfolioProject(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const data = createProjectSchema.parse(req.body);
        const project = await prisma_1.default.portfolioProject.create({
            data: {
                userId: req.user.userId,
                title: data.title,
                description: data.description,
                mediaUrls: data.mediaUrls || [],
                externalUrl: data.externalUrl,
            },
        });
        res.status(201).json({ project });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create portfolio project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getUserPortfolioProjects(req, res) {
    try {
        const { userId } = req.params;
        const projects = await prisma_1.default.portfolioProject.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ projects });
    }
    catch (error) {
        console.error('Get portfolio projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updatePortfolioProject(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { projectId } = req.params;
        // Check if user owns this project
        const existing = await prisma_1.default.portfolioProject.findUnique({
            where: { id: projectId },
        });
        if (!existing || existing.userId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const data = createProjectSchema.parse(req.body);
        const project = await prisma_1.default.portfolioProject.update({
            where: { id: projectId },
            data: {
                title: data.title,
                description: data.description,
                mediaUrls: data.mediaUrls || [],
                externalUrl: data.externalUrl,
            },
        });
        res.json({ project });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Update portfolio project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function deletePortfolioProject(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { projectId } = req.params;
        // Check if user owns this project
        const existing = await prisma_1.default.portfolioProject.findUnique({
            where: { id: projectId },
        });
        if (!existing || existing.userId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await prisma_1.default.portfolioProject.delete({
            where: { id: projectId },
        });
        res.json({ message: 'Portfolio project deleted' });
    }
    catch (error) {
        console.error('Delete portfolio project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=portfolio.controller.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboarding = onboarding;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.addSkill = addSkill;
exports.removeSkill = removeSkill;
exports.addExperience = addExperience;
exports.updateExperience = updateExperience;
exports.deleteExperience = deleteExperience;
exports.searchUsers = searchUsers;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const onboardingSchema = zod_1.z.object({
    roles: zod_1.z.array(zod_1.z.enum([client_1.Role.CANDIDATE, client_1.Role.FREELANCER, client_1.Role.COMPANY])),
    isLookingForJob: zod_1.z.boolean(),
    isOfferingFreelance: zod_1.z.boolean(),
    headline: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    companyName: zod_1.z.string().optional(),
    companySize: zod_1.z.string().optional(),
    industry: zod_1.z.string().optional(),
});
const updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().optional(),
    headline: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    templateId: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().optional(),
    isLookingForJob: zod_1.z.boolean().optional(),
    isOfferingFreelance: zod_1.z.boolean().optional(),
    companyName: zod_1.z.string().optional(),
    companySize: zod_1.z.string().optional(),
    industry: zod_1.z.string().optional(),
    websiteUrl: zod_1.z.string().optional(),
    about: zod_1.z.string().optional(),
});
async function onboarding(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const data = onboardingSchema.parse(req.body);
        const user = await prisma_1.default.user.update({
            where: { id: req.user.userId },
            data: {
                roles: data.roles,
                isLookingForJob: data.isLookingForJob,
                isOfferingFreelance: data.isOfferingFreelance,
                headline: data.headline,
                location: data.location,
                companyName: data.companyName,
                companySize: data.companySize,
                industry: data.industry,
            },
            select: {
                id: true,
                email: true,
                displayName: true,
                headline: true,
                roles: true,
                isLookingForJob: true,
                isOfferingFreelance: true,
            },
        });
        // Create user preferences
        await prisma_1.default.userPreferences.upsert({
            where: { userId: req.user.userId },
            create: { userId: req.user.userId },
            update: {},
        });
        res.json({ user });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Onboarding error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getProfile(req, res) {
    try {
        const { userId } = req.params;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                skills: true,
                languages: true,
                education: { orderBy: { startDate: 'desc' } },
                experience: { orderBy: { startDate: 'desc' } },
                certifications: { orderBy: { date: 'desc' } },
                portfolioProjects: { orderBy: { createdAt: 'desc' } },
                services: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Don't expose password hash
        const { passwordHash, ...userProfile } = user;
        res.json({ user: userProfile });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateProfile(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const data = updateProfileSchema.parse(req.body);
        const user = await prisma_1.default.user.update({
            where: { id: req.user.userId },
            data,
        });
        const { passwordHash, ...userProfile } = user;
        res.json({ user: userProfile });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Skills
async function addSkill(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { name } = req.body;
        const skill = await prisma_1.default.userSkill.create({
            data: {
                userId: req.user.userId,
                name,
            },
        });
        res.status(201).json({ skill });
    }
    catch (error) {
        console.error('Add skill error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function removeSkill(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { skillId } = req.params;
        await prisma_1.default.userSkill.delete({
            where: {
                id: skillId,
                userId: req.user.userId,
            },
        });
        res.json({ message: 'Skill removed' });
    }
    catch (error) {
        console.error('Remove skill error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Experience
async function addExperience(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const experience = await prisma_1.default.experience.create({
            data: {
                userId: req.user.userId,
                ...req.body,
            },
        });
        res.status(201).json({ experience });
    }
    catch (error) {
        console.error('Add experience error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateExperience(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { experienceId } = req.params;
        const experience = await prisma_1.default.experience.updateMany({
            where: {
                id: experienceId,
                userId: req.user.userId,
            },
            data: req.body,
        });
        res.json({ experience });
    }
    catch (error) {
        console.error('Update experience error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteExperience(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { experienceId } = req.params;
        await prisma_1.default.experience.deleteMany({
            where: {
                id: experienceId,
                userId: req.user.userId,
            },
        });
        res.json({ message: 'Experience deleted' });
    }
    catch (error) {
        console.error('Delete experience error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
// Search users
async function searchUsers(req, res) {
    try {
        const { q, role, location, isLookingForJob, isOfferingFreelance, skill, limit = '20', offset = '0', } = req.query;
        const where = {};
        if (q) {
            where.OR = [
                { displayName: { contains: q, mode: 'insensitive' } },
                { headline: { contains: q, mode: 'insensitive' } },
            ];
        }
        if (role) {
            where.roles = { has: role };
        }
        if (location) {
            where.location = { contains: location, mode: 'insensitive' };
        }
        if (isLookingForJob !== undefined) {
            where.isLookingForJob = isLookingForJob === 'true';
        }
        if (isOfferingFreelance !== undefined) {
            where.isOfferingFreelance = isOfferingFreelance === 'true';
        }
        if (skill) {
            where.skills = {
                some: {
                    name: { contains: skill, mode: 'insensitive' },
                },
            };
        }
        const users = await prisma_1.default.user.findMany({
            where,
            select: {
                id: true,
                displayName: true,
                headline: true,
                avatarUrl: true,
                location: true,
                roles: true,
                skills: { take: 5 },
                portfolioProjects: { take: 1 },
            },
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { createdAt: 'desc' },
        });
        const total = await prisma_1.default.user.count({ where });
        res.json({ users, total });
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=user.controller.js.map
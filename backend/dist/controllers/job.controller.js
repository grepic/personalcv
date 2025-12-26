"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJob = createJob;
exports.getJobs = getJobs;
exports.getJob = getJob;
exports.updateJob = updateJob;
exports.updateJobStatus = updateJobStatus;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const createJobSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    employmentType: zod_1.z.enum([
        client_1.EmploymentType.FULL_TIME,
        client_1.EmploymentType.PART_TIME,
        client_1.EmploymentType.CONTRACT,
        client_1.EmploymentType.INTERNSHIP,
        client_1.EmploymentType.FREELANCE,
    ]),
    location: zod_1.z.string(),
    isRemote: zod_1.z.boolean(),
    salaryMin: zod_1.z.number().optional(),
    salaryMax: zod_1.z.number().optional(),
    currency: zod_1.z.string().optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional(),
});
async function createJob(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // Check if user is a company
        if (!req.user.roles.includes(client_1.Role.COMPANY)) {
            return res.status(403).json({ error: 'Only companies can post jobs' });
        }
        const data = createJobSchema.parse(req.body);
        // Create job
        const job = await prisma_1.default.job.create({
            data: {
                companyId: req.user.userId,
                title: data.title,
                description: data.description,
                employmentType: data.employmentType,
                location: data.location,
                isRemote: data.isRemote,
                salaryMin: data.salaryMin,
                salaryMax: data.salaryMax,
                currency: data.currency,
                skills: {
                    create: (data.skills || []).map(name => ({ name })),
                },
            },
            include: {
                skills: true,
                company: {
                    select: {
                        id: true,
                        displayName: true,
                        companyName: true,
                        avatarUrl: true,
                        location: true,
                    },
                },
            },
        });
        // Create a post for this job
        const post = await prisma_1.default.post.create({
            data: {
                authorId: req.user.userId,
                type: client_1.PostType.JOB,
                title: job.title,
                content: job.description,
                mediaUrls: [],
                tags: data.skills || [],
                visibility: 'public',
                jobId: job.id,
            },
        });
        // Notify followers and users with matching skills/roles
        await notifyJobPosted(job);
        res.status(201).json({ job });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create job error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function notifyJobPosted(job) {
    try {
        // Find users who follow this company
        const followers = await prisma_1.default.userFollowCompany.findMany({
            where: {
                companyId: job.companyId,
            },
            include: {
                user: {
                    include: {
                        preferences: true,
                    },
                },
            },
        });
        // Find users with matching skills
        const jobSkills = await prisma_1.default.jobSkill.findMany({
            where: { jobId: job.id },
            select: { name: true },
        });
        const skillNames = jobSkills.map(s => s.name);
        const usersWithMatchingSkills = await prisma_1.default.user.findMany({
            where: {
                skills: {
                    some: {
                        name: { in: skillNames },
                    },
                },
                isLookingForJob: true,
            },
            include: {
                preferences: true,
            },
        });
        // Create notifications
        const notificationsToCreate = [];
        for (const follower of followers) {
            if (follower.user.preferences?.notifyJobsFromFollowedCompanies) {
                notificationsToCreate.push({
                    userId: follower.userId,
                    type: 'JOB_POSTED',
                    data: {
                        jobId: job.id,
                        companyId: job.companyId,
                        jobTitle: job.title,
                    },
                });
            }
        }
        for (const user of usersWithMatchingSkills) {
            if (user.preferences?.notifyJobsMatchingSkills) {
                // Don't duplicate if they're already a follower
                const alreadyNotified = notificationsToCreate.some(n => n.userId === user.id);
                if (!alreadyNotified) {
                    notificationsToCreate.push({
                        userId: user.id,
                        type: 'JOB_POSTED',
                        data: {
                            jobId: job.id,
                            companyId: job.companyId,
                            jobTitle: job.title,
                        },
                    });
                }
            }
        }
        if (notificationsToCreate.length > 0) {
            await prisma_1.default.notification.createMany({
                data: notificationsToCreate,
            });
        }
    }
    catch (error) {
        console.error('Notify job posted error:', error);
    }
}
async function getJobs(req, res) {
    try {
        const { q, location, remote, employmentType, minSalary, maxSalary, skill, status = 'OPEN', limit = '20', offset = '0', } = req.query;
        const where = {
            status: status,
        };
        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
            ];
        }
        if (location) {
            where.location = { contains: location, mode: 'insensitive' };
        }
        if (remote !== undefined) {
            where.isRemote = remote === 'true';
        }
        if (employmentType) {
            where.employmentType = employmentType;
        }
        if (minSalary) {
            where.salaryMin = { gte: parseFloat(minSalary) };
        }
        if (maxSalary) {
            where.salaryMax = { lte: parseFloat(maxSalary) };
        }
        if (skill) {
            where.skills = {
                some: {
                    name: { contains: skill, mode: 'insensitive' },
                },
            };
        }
        const jobs = await prisma_1.default.job.findMany({
            where,
            include: {
                company: {
                    select: {
                        id: true,
                        displayName: true,
                        companyName: true,
                        avatarUrl: true,
                        location: true,
                    },
                },
                skills: true,
                _count: {
                    select: {
                        applications: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const total = await prisma_1.default.job.count({ where });
        res.json({ jobs, total });
    }
    catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getJob(req, res) {
    try {
        const { jobId } = req.params;
        const job = await prisma_1.default.job.findUnique({
            where: { id: jobId },
            include: {
                company: {
                    select: {
                        id: true,
                        displayName: true,
                        companyName: true,
                        avatarUrl: true,
                        location: true,
                        about: true,
                        websiteUrl: true,
                    },
                },
                skills: true,
            },
        });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json({ job });
    }
    catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateJob(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { jobId } = req.params;
        // Check ownership
        const existingJob = await prisma_1.default.job.findUnique({
            where: { id: jobId },
        });
        if (!existingJob || existingJob.companyId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const job = await prisma_1.default.job.update({
            where: { id: jobId },
            data: req.body,
            include: {
                skills: true,
                company: true,
            },
        });
        res.json({ job });
    }
    catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateJobStatus(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { jobId } = req.params;
        const { status } = req.body;
        // Check ownership
        const existingJob = await prisma_1.default.job.findUnique({
            where: { id: jobId },
        });
        if (!existingJob || existingJob.companyId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const job = await prisma_1.default.job.update({
            where: { id: jobId },
            data: { status },
        });
        res.json({ job });
    }
    catch (error) {
        console.error('Update job status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=job.controller.js.map
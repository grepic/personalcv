"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyToJob = applyToJob;
exports.getJobApplications = getJobApplications;
exports.updateApplicationStatus = updateApplicationStatus;
exports.getMyApplications = getMyApplications;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
async function applyToJob(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { jobId } = req.params;
        // Check if user is a candidate or freelancer
        if (!req.user.roles.includes(client_1.Role.CANDIDATE) && !req.user.roles.includes(client_1.Role.FREELANCER)) {
            return res.status(403).json({ error: 'Only candidates and freelancers can apply to jobs' });
        }
        // Get job details
        const job = await prisma_1.default.job.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        if (job.status !== 'OPEN') {
            return res.status(400).json({ error: 'Job is not open for applications' });
        }
        // Check if already applied
        const existingApplication = await prisma_1.default.application.findUnique({
            where: {
                jobId_candidateId: {
                    jobId,
                    candidateId: req.user.userId,
                },
            },
        });
        if (existingApplication) {
            return res.status(400).json({ error: 'Already applied to this job' });
        }
        // Create application
        const application = await prisma_1.default.application.create({
            data: {
                jobId,
                candidateId: req.user.userId,
                companyId: job.companyId,
                status: client_1.ApplicationStatus.NEW,
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                candidate: {
                    select: {
                        id: true,
                        displayName: true,
                        headline: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        // Create notification for company
        await prisma_1.default.notification.create({
            data: {
                userId: job.companyId,
                type: 'APPLICATION_UPDATE',
                data: {
                    applicationId: application.id,
                    candidateId: req.user.userId,
                    jobId,
                    status: 'NEW',
                },
            },
        });
        res.status(201).json({ application });
    }
    catch (error) {
        console.error('Apply to job error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getJobApplications(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { jobId } = req.params;
        // Check if user is the job owner
        const job = await prisma_1.default.job.findUnique({
            where: { id: jobId },
        });
        if (!job || job.companyId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const applications = await prisma_1.default.application.findMany({
            where: { jobId },
            include: {
                candidate: {
                    select: {
                        id: true,
                        displayName: true,
                        headline: true,
                        avatarUrl: true,
                        location: true,
                        skills: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ applications });
    }
    catch (error) {
        console.error('Get job applications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateApplicationStatus(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { applicationId } = req.params;
        const { status } = req.body;
        // Get application
        const application = await prisma_1.default.application.findUnique({
            where: { id: applicationId },
            include: { job: true },
        });
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        // Check if user is the company owner
        if (application.job.companyId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        // Update status
        const updated = await prisma_1.default.application.update({
            where: { id: applicationId },
            data: { status },
        });
        // Notify candidate
        await prisma_1.default.notification.create({
            data: {
                userId: application.candidateId,
                type: 'APPLICATION_UPDATE',
                data: {
                    applicationId,
                    jobId: application.jobId,
                    status,
                },
            },
        });
        res.json({ application: updated });
    }
    catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getMyApplications(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const applications = await prisma_1.default.application.findMany({
            where: { candidateId: req.user.userId },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        isRemote: true,
                        employmentType: true,
                        status: true,
                        company: {
                            select: {
                                id: true,
                                displayName: true,
                                companyName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ applications });
    }
    catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=application.controller.js.map
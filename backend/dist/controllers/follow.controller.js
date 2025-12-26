"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.followCompany = followCompany;
exports.unfollowCompany = unfollowCompany;
exports.getFollowedCompanies = getFollowedCompanies;
exports.addFollowedRole = addFollowedRole;
exports.removeFollowedRole = removeFollowedRole;
exports.getFollowedRoles = getFollowedRoles;
const prisma_1 = __importDefault(require("../utils/prisma"));
async function followCompany(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { companyId } = req.params;
        // Check if company exists
        const company = await prisma_1.default.user.findUnique({
            where: { id: companyId },
        });
        if (!company || !company.roles.includes('COMPANY')) {
            return res.status(404).json({ error: 'Company not found' });
        }
        // Check if already following
        const existing = await prisma_1.default.userFollowCompany.findUnique({
            where: {
                userId_companyId: {
                    userId: req.user.userId,
                    companyId,
                },
            },
        });
        if (existing) {
            return res.status(400).json({ error: 'Already following this company' });
        }
        const follow = await prisma_1.default.userFollowCompany.create({
            data: {
                userId: req.user.userId,
                companyId,
            },
        });
        res.status(201).json({ follow });
    }
    catch (error) {
        console.error('Follow company error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function unfollowCompany(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { companyId } = req.params;
        await prisma_1.default.userFollowCompany.deleteMany({
            where: {
                userId: req.user.userId,
                companyId,
            },
        });
        res.json({ message: 'Unfollowed company' });
    }
    catch (error) {
        console.error('Unfollow company error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getFollowedCompanies(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const follows = await prisma_1.default.userFollowCompany.findMany({
            where: { userId: req.user.userId },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        companyName: true,
                        avatarUrl: true,
                        location: true,
                        industry: true,
                    },
                },
            },
        });
        res.json({ companies: follows.map(f => ({ ...f.user, followedAt: f.createdAt })) });
    }
    catch (error) {
        console.error('Get followed companies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function addFollowedRole(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { roleKeyword } = req.body;
        const follow = await prisma_1.default.userFollowRole.create({
            data: {
                userId: req.user.userId,
                roleKeyword,
            },
        });
        res.status(201).json({ follow });
    }
    catch (error) {
        console.error('Add followed role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function removeFollowedRole(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { roleId } = req.params;
        await prisma_1.default.userFollowRole.deleteMany({
            where: {
                id: roleId,
                userId: req.user.userId,
            },
        });
        res.json({ message: 'Role removed' });
    }
    catch (error) {
        console.error('Remove followed role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getFollowedRoles(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const roles = await prisma_1.default.userFollowRole.findMany({
            where: { userId: req.user.userId },
        });
        res.json({ roles });
    }
    catch (error) {
        console.error('Get followed roles error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=follow.controller.js.map
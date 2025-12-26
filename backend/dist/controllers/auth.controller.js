"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.me = me;
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const jwt_1 = require("../utils/jwt");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    displayName: zod_1.z.string().min(1),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
async function register(req, res) {
    try {
        const { email, password, displayName } = registerSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Create user (no roles yet - will be set during onboarding)
        const user = await prisma_1.default.user.create({
            data: {
                email,
                passwordHash,
                displayName,
                roles: [],
            },
            select: {
                id: true,
                email: true,
                displayName: true,
                roles: true,
            },
        });
        // Generate tokens
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, roles: user.roles });
        const refreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, roles: user.roles });
        // Store refresh token
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: (0, jwt_1.getRefreshTokenExpiry)(),
            },
        });
        res.status(201).json({
            user,
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function login(req, res) {
    try {
        const { email, password } = loginSchema.parse(req.body);
        // Find user
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                displayName: true,
                passwordHash: true,
                roles: true,
            },
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Verify password
        const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate tokens
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, roles: user.roles });
        const refreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, roles: user.roles });
        // Store refresh token
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: (0, jwt_1.getRefreshTokenExpiry)(),
            },
        });
        const { passwordHash, ...userWithoutPassword } = user;
        res.json({
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function refresh(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }
        // Verify refresh token
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        // Check if token exists in database
        const storedToken = await prisma_1.default.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!storedToken) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        // Check if token is expired
        if (storedToken.expiresAt < new Date()) {
            await prisma_1.default.refreshToken.delete({ where: { id: storedToken.id } });
            return res.status(401).json({ error: 'Refresh token expired' });
        }
        // Generate new access token
        const accessToken = (0, jwt_1.generateAccessToken)({
            userId: storedToken.user.id,
            roles: storedToken.user.roles,
        });
        res.json({ accessToken });
    }
    catch (error) {
        console.error('Refresh error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
}
async function logout(req, res) {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await prisma_1.default.refreshToken.deleteMany({
                where: { token: refreshToken },
            });
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function me(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                displayName: true,
                headline: true,
                avatarUrl: true,
                location: true,
                roles: true,
                isLookingForJob: true,
                isOfferingFreelance: true,
                templateId: true,
                companyName: true,
                companySize: true,
                industry: true,
                websiteUrl: true,
                about: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=auth.controller.js.map
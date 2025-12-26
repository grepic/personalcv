"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFreelancerService = createFreelancerService;
exports.getUserFreelancerServices = getUserFreelancerServices;
exports.updateFreelancerService = updateFreelancerService;
exports.deleteFreelancerService = deleteFreelancerService;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const createServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1),
    price: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('USD'),
    deliveryTime: zod_1.z.string().min(1),
});
async function createFreelancerService(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const data = createServiceSchema.parse(req.body);
        const service = await prisma_1.default.freelancerService.create({
            data: {
                userId: req.user.userId,
                name: data.name,
                description: data.description,
                price: data.price,
                currency: data.currency,
                deliveryTime: data.deliveryTime,
            },
        });
        res.status(201).json({ service });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create service error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getUserFreelancerServices(req, res) {
    try {
        const { userId } = req.params;
        const services = await prisma_1.default.freelancerService.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ services });
    }
    catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateFreelancerService(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { serviceId } = req.params;
        // Check if user owns this service
        const existing = await prisma_1.default.freelancerService.findUnique({
            where: { id: serviceId },
        });
        if (!existing || existing.userId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const data = createServiceSchema.parse(req.body);
        const service = await prisma_1.default.freelancerService.update({
            where: { id: serviceId },
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                currency: data.currency,
                deliveryTime: data.deliveryTime,
            },
        });
        res.json({ service });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Update service error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteFreelancerService(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { serviceId } = req.params;
        // Check if user owns this service
        const existing = await prisma_1.default.freelancerService.findUnique({
            where: { id: serviceId },
        });
        if (!existing || existing.userId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await prisma_1.default.freelancerService.delete({
            where: { id: serviceId },
        });
        res.json({ message: 'Service deleted' });
    }
    catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=service.controller.js.map
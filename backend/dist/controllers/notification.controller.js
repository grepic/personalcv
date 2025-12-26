"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
const prisma_1 = __importDefault(require("../utils/prisma"));
async function getNotifications(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { limit = '20', offset = '0', unreadOnly = 'false' } = req.query;
        const where = {
            userId: req.user.userId,
        };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }
        const notifications = await prisma_1.default.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const unreadCount = await prisma_1.default.notification.count({
            where: {
                userId: req.user.userId,
                isRead: false,
            },
        });
        res.json({ notifications, unreadCount });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function markAsRead(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { notificationId } = req.params;
        const notification = await prisma_1.default.notification.updateMany({
            where: {
                id: notificationId,
                userId: req.user.userId,
            },
            data: {
                isRead: true,
            },
        });
        res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function markAllAsRead(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        await prisma_1.default.notification.updateMany({
            where: {
                userId: req.user.userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=notification.controller.js.map
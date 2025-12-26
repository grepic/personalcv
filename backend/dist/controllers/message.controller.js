"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversations = getConversations;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.startConversation = startConversation;
const prisma_1 = __importDefault(require("../utils/prisma"));
async function getConversations(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const conversations = await prisma_1.default.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: req.user.userId,
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                avatarUrl: true,
                                headline: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { lastMessageAt: 'desc' },
        });
        // Format conversations to show the other participant
        const formattedConversations = conversations.map(conv => ({
            id: conv.id,
            lastMessageAt: conv.lastMessageAt,
            otherUser: conv.participants.find(p => p.userId !== req.user.userId)?.user,
            lastMessage: conv.messages[0],
        }));
        res.json({ conversations: formattedConversations });
    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getMessages(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { conversationId } = req.params;
        const { limit = '50', offset = '0' } = req.query;
        // Check if user is a participant
        const participant = await prisma_1.default.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId: req.user.userId,
            },
        });
        if (!participant) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const messages = await prisma_1.default.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        res.json({ messages });
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function sendMessage(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { conversationId } = req.params;
        const { text } = req.body;
        // Check if user is a participant
        const participant = await prisma_1.default.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId: req.user.userId,
            },
        });
        if (!participant) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const message = await prisma_1.default.message.create({
            data: {
                conversationId,
                senderId: req.user.userId,
                text,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        // Update conversation lastMessageAt
        await prisma_1.default.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
        });
        // Create notification for other participant(s)
        const otherParticipants = await prisma_1.default.conversationParticipant.findMany({
            where: {
                conversationId,
                userId: { not: req.user.userId },
            },
        });
        for (const participant of otherParticipants) {
            await prisma_1.default.notification.create({
                data: {
                    userId: participant.userId,
                    type: 'MESSAGE',
                    data: {
                        conversationId,
                        senderId: req.user.userId,
                        messageId: message.id,
                    },
                },
            });
        }
        res.status(201).json({ message });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function startConversation(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { userId, text } = req.body;
        // Check if conversation already exists
        const existingConversation = await prisma_1.default.conversation.findFirst({
            where: {
                AND: [
                    {
                        participants: {
                            some: { userId: req.user.userId },
                        },
                    },
                    {
                        participants: {
                            some: { userId },
                        },
                    },
                ],
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                avatarUrl: true,
                                headline: true,
                            },
                        },
                    },
                },
            },
        });
        if (existingConversation) {
            // If conversation exists, just send the message
            const message = await prisma_1.default.message.create({
                data: {
                    conversationId: existingConversation.id,
                    senderId: req.user.userId,
                    text,
                },
            });
            await prisma_1.default.conversation.update({
                where: { id: existingConversation.id },
                data: { lastMessageAt: new Date() },
            });
            return res.json({
                conversation: existingConversation,
                message,
            });
        }
        // Create new conversation
        const conversation = await prisma_1.default.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: req.user.userId },
                        { userId },
                    ],
                },
                messages: {
                    create: {
                        senderId: req.user.userId,
                        text,
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                avatarUrl: true,
                                headline: true,
                            },
                        },
                    },
                },
                messages: true,
            },
        });
        // Create notification
        await prisma_1.default.notification.create({
            data: {
                userId,
                type: 'MESSAGE',
                data: {
                    conversationId: conversation.id,
                    senderId: req.user.userId,
                },
            },
        });
        res.status(201).json({ conversation });
    }
    catch (error) {
        console.error('Start conversation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=message.controller.js.map
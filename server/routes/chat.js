const express = require('express');
const prisma = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const getAuthUserId = (req) => req.user?.userId || req.user?.id;

router.get('/rooms', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }]
      },
      orderBy: { lastActivity: 'desc' },
      include: {
        participant1: { select: { id: true, username: true, email: true } },
        participant2: { select: { id: true, username: true, email: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { id: true, username: true, email: true } } }
        }
      }
    });

    res.json({ success: true, rooms });
  } catch (error) {
    console.error('List rooms error:', error);
    res.status(500).json({ message: 'Failed to load rooms', error: error.message });
  }
});

router.post('/rooms', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    const { participantId } = req.body || {};
    if (!participantId || typeof participantId !== 'string') {
      return res.status(400).json({ message: 'participantId is required' });
    }
    if (participantId === userId) {
      return res.status(400).json({ message: 'Cannot create a room with yourself' });
    }

    // Ensure stable ordering for @@unique(participant1Id, participant2Id)
    const [p1, p2] = [userId, participantId].sort();

    const room = await prisma.chatRoom.upsert({
      where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
      update: { lastActivity: new Date() },
      create: {
        participant1Id: p1,
        participant2Id: p2,
        lastActivity: new Date(),
        lastMessageAt: new Date(),
        isTemporary: false,
        timeoutHours: 24,
        isConverted: true
      },
      include: {
        participant1: { select: { id: true, username: true, email: true } },
        participant2: { select: { id: true, username: true, email: true } }
      }
    });

    res.status(201).json({ success: true, room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Failed to create room', error: error.message });
  }
});

router.get('/rooms/:roomId/messages', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    const { roomId } = req.params;

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true, participant1Id: true, participant2Id: true }
    });

    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.participant1Id !== userId && room.participant2Id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, username: true, email: true } } }
    });

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to load messages', error: error.message });
  }
});

router.post('/rooms/:roomId/messages', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    const { roomId } = req.params;
    const { content } = req.body || {};
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'content is required' });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true, participant1Id: true, participant2Id: true, blockedBy: true }
    });

    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.participant1Id !== userId && room.participant2Id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (room.blockedBy) {
      return res.status(403).json({ message: 'This conversation is blocked' });
    }

    const now = new Date();
    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: userId,
        content: content.trim(),
        isEncrypted: false
      },
      include: { sender: { select: { id: true, username: true, email: true } } }
    });

    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { lastActivity: now, lastMessageAt: now }
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

module.exports = router;

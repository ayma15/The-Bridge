const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const { requireAuth } = require('../middleware/auth');

// Chat with AI assistant
router.post('/chat', requireAuth, [
  body('message').notEmpty().isLength({ min: 1, max: 1000 }),
  body('conversationId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, conversationId } = req.body;

    const result = await aiService.chat(req.user.userId, message, conversationId);

    res.json({
      message: 'AI response generated',
      ...result
    });
  } catch (error) {
    console.error('AI chat error:', error);
    // If it's a database error, try to return a fallback response
    if (error.message.includes('database') || error.message.includes('prisma') || error.message.includes('Failed to process') || error.message.includes('P2002') || error.message.includes('P2025')) {
      try {
        const userMessage = req.body.message || 'help';
        const fallbackResponse = aiService.getFallbackResponse(userMessage);
        return res.json({
          message: 'AI response generated (fallback mode)',
          conversationId: null,
          response: fallbackResponse,
          conversation: null
        });
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        // Ultimate fallback
        return res.json({
          message: 'AI response generated',
          conversationId: null,
          response: 'I\'m here to help! I can assist with Social Boost services, Jobs, Shop, wallet, crypto trading, Promotion, and more. What would you like to know?',
          conversation: null
        });
      }
    }
    res.status(500).json({ message: error.message || 'Error processing AI request' });
  }
});

// Get user's conversations
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await aiService.getUserConversations(
      req.user.userId,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: error.message || 'Error fetching conversations' });
  }
});

// Get conversation messages
router.get('/conversations/:conversationId/messages', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await aiService.getConversationMessages(conversationId, req.user.userId);

    res.json({ conversation });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: error.message || 'Error fetching messages' });
  }
});

// Delete conversation
router.delete('/conversations/:conversationId', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    await aiService.deleteConversation(conversationId, req.user.userId);

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: error.message || 'Error deleting conversation' });
  }
});

module.exports = router;


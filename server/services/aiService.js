const axios = require('axios');
const prisma = require('../config/database');

/**
 * AI Assistant Service
 * Handles AI conversations and responses
 */

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  }

  /**
   * Get system prompt for the AI assistant
   */
  getSystemPrompt() {
    return `You are a helpful AI assistant for "The Bridge" - a comprehensive multi-service platform.

Your role is to help users with:
1. Social Boost services (social media marketing)
2. Jobs platform (finding professionals, posting services)
3. Shop (buying and selling products)
4. P2P crypto trading
5. Promotion services
6. General platform navigation and support
7. Wallet and payment questions

Platform Features:
- Users have wallets with POINTS (game currency) for transactions
- Multiple payment methods: PayPal, Payeer, Crypto, Chappa, SantimPay, Telebirr
- Freelancers can link Telegram channels for portfolios
- All transactions are secure and admin-monitored
- Encrypted chat available for user communications

Be helpful, concise, and guide users to the right features. If you don't know something, admit it and suggest contacting support.`;
  }

  /**
   * Send message to AI and get response
   */
  async chat(userId, message, conversationId = null) {
    try {
      let conversation;

      if (conversationId) {
        // Get existing conversation
        conversation = await prisma.aIConversation.findUnique({
          where: { id: conversationId },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        });

        if (!conversation || conversation.userId !== userId) {
          throw new Error('Conversation not found');
        }
      } else {
        // Create new conversation
        conversation = await prisma.aIConversation.create({
          data: {
            userId,
            title: message.substring(0, 50) // Use first 50 chars as title
          },
          include: {
            messages: []
          }
        });
      }

      // Build message history
      const messages = [
        { role: 'system', content: this.getSystemPrompt() },
        ...conversation.messages.map(msg => ({
          role: msg.role.toLowerCase(),
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      // Call AI API
      let aiResponse;
      if (this.apiKey) {
        // Use OpenAI API
        aiResponse = await this.callOpenAI(messages);
      } else {
        // Fallback to simple response if no API key
        aiResponse = this.getFallbackResponse(message);
      }

      // Save user message
      await prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: message
        }
      });

      // Save AI response
      await prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: aiResponse
        }
      });

      return {
        conversationId: conversation.id,
        response: aiResponse,
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt
        }
      };
    } catch (error) {
      console.error('AI chat error:', error);
      // Return a more descriptive error message
      const errorMessage = error.message || 'Failed to process AI request';
      // If it's a database error, provide fallback response
      if (error.code === 'P2002' || error.code === 'P2025' || error.message.includes('prisma') || error.message.includes('database')) {
        // Database error - use fallback response
        return {
          conversationId: null,
          response: this.getFallbackResponse(message),
          conversation: null
        };
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(messages) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      // Fallback if API fails
      return this.getFallbackResponse(messages[messages.length - 1].content);
    }
  }

  /**
   * Fallback response when AI API is not available
   */
  getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('smm') || lowerMessage.includes('social media') || lowerMessage.includes('social boost')) {
      return 'I can help you with Social Boost services! You can order social media followers, likes, views, and more. Go to the Social Boost section to browse available services. Would you like to know more about a specific service?';
    }

    if (lowerMessage.includes('freelanc') || lowerMessage.includes('job') || lowerMessage.includes('service')) {
      return 'The Jobs platform allows you to hire skilled professionals or offer your services. You can browse professional profiles, view their portfolios via Telegram channels, and place orders. Need help finding a specific skill?';
    }

    if (lowerMessage.includes('product') || lowerMessage.includes('marketplace') || lowerMessage.includes('shop') || lowerMessage.includes('buy') || lowerMessage.includes('sell')) {
      return 'Our Shop lets you buy and sell physical products. You can browse products by category, view seller profiles, and make secure purchases using your wallet balance. What are you looking for?';
    }

    if (lowerMessage.includes('wallet') || lowerMessage.includes('balance') || lowerMessage.includes('deposit') || lowerMessage.includes('withdraw')) {
      return 'Your wallet stores POINTS (our platform currency). You can deposit funds via PayPal, Payeer, Crypto, Chappa, SantimPay, or Telebirr. Withdrawals are processed by admins for security. Check your balance in the Wallet section.';
    }

    if (lowerMessage.includes('crypto') || lowerMessage.includes('p2p') || lowerMessage.includes('bitcoin') || lowerMessage.includes('ethereum')) {
      return 'P2P crypto trading is available with admin-controlled transactions for security. You can buy cryptocurrencies like BTC, ETH, USDT, TRX using various payment methods. All trades are monitored to prevent scams.';
    }

    if (lowerMessage.includes('ad') || lowerMessage.includes('advertis') || lowerMessage.includes('promotion') || lowerMessage.includes('promote')) {
      return 'You can create promotion campaigns to promote your business! Choose from banner promotions, sponsored content, Telegram promotions, or popup promotions. Set your budget and track impressions and clicks. Ready to create a campaign?';
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return 'I\'m here to help! I can assist with Social Boost services, Jobs, Shop, wallet, crypto trading, Promotion, and more. What would you like to know?';
    }

    return 'I understand you need help. I can assist with Social Boost services, Jobs, Shop, wallet management, crypto trading, Promotion, and general platform questions. What specific area can I help you with?';
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [conversations, total] = await Promise.all([
        prisma.aIConversation.findMany({
          where: { userId },
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            },
            _count: {
              select: { messages: true }
            }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.aIConversation.count({ where: { userId } })
      ]);

      return {
        conversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get conversations error:', error);
      throw new Error('Failed to fetch conversations');
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId, userId) {
    try {
      const conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!conversation || conversation.userId !== userId) {
        throw new Error('Conversation not found');
      }

      return conversation;
    } catch (error) {
      console.error('Get messages error:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId, userId) {
    try {
      const conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation || conversation.userId !== userId) {
        throw new Error('Conversation not found');
      }

      await prisma.aIConversation.delete({
        where: { id: conversationId }
      });

      return { success: true };
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw new Error('Failed to delete conversation');
    }
  }
}

module.exports = new AIService();


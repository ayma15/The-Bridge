const TelegramBot = require('node-telegram-bot-api');

/**
 * Telegram Service
 * Handles Telegram bot integration for authentication and portfolio linking
 */

class TelegramService {
  constructor() {
    this.bot = null;
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    }
  }

  /**
   * Verify Telegram authentication
   */
  async verifyTelegramAuth(authData) {
    try {
      // Verify Telegram Web App authentication data
      // This should verify the hash from Telegram
      const crypto = require('crypto');
      
      const { hash, ...data } = authData;
      const dataCheckString = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('\n');
      
      const secretKey = crypto
        .createHash('sha256')
        .update(process.env.TELEGRAM_BOT_TOKEN)
        .digest();
      
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      
      return calculatedHash === hash;
    } catch (error) {
      console.error('Telegram auth verification error:', error);
      return false;
    }
  }

  /**
   * Get user info from Telegram
   */
  async getUserInfo(telegramId) {
    try {
      if (!this.bot) {
        throw new Error('Telegram bot not initialized');
      }

      // Get chat member info (for groups/channels)
      // For direct users, you'd use getChat
      const chatMember = await this.bot.getChatMember(telegramId, telegramId);
      
      return {
        id: chatMember.user.id,
        username: chatMember.user.username,
        firstName: chatMember.user.first_name,
        lastName: chatMember.user.last_name
      };
    } catch (error) {
      console.error('Get Telegram user info error:', error);
      throw new Error('Failed to get Telegram user info');
    }
  }

  /**
   * Verify Telegram channel ownership
   */
  async verifyChannelOwnership(userId, channelUsername) {
    try {
      if (!this.bot) {
        throw new Error('Telegram bot not initialized');
      }

      const channelId = `@${channelUsername.replace('@', '')}`;
      const chatMember = await this.bot.getChatMember(channelId, userId);
      
      // Check if user is admin or creator of the channel
      return ['administrator', 'creator'].includes(chatMember.status);
    } catch (error) {
      console.error('Verify channel ownership error:', error);
      return false;
    }
  }

  /**
   * Send notification via Telegram
   */
  async sendNotification(telegramId, message) {
    try {
      if (!this.bot) {
        throw new Error('Telegram bot not initialized');
      }

      await this.bot.sendMessage(telegramId, message, {
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Send Telegram notification error:', error);
      // Don't throw - notifications are not critical
    }
  }
}

module.exports = new TelegramService();


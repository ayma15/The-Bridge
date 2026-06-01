const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user settings
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Try to get existing settings, create default if none exist
    let settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId,
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: false,
          orderUpdates: true,
          securityAlerts: true,
          promotionalEmails: false,
          darkMode: false,
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          currency: 'USD',
          twoFactorEnabled: false,
          profileVisibility: 'public',
          emailFrequency: 'immediate',
          autoSave: true,
          showOnlineStatus: true,
          allowDirectMessages: true
        }
      });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
});

// Update user settings
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body.settings || req.body;

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        ...updates
      }
    });

    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
});

// Export user data
router.get('/export', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        bio: true,
        website: true,
        twitter: true,
        linkedin: true,
        github: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        sellerAddress: true,
        sellerTerms: true,
        sellerPhone: true
      }
    });

    // Get user's products
    const products = await prisma.product.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        condition: true,
        category: true,
        images: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Get user's orders (as buyer)
    const orders = await prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        product: {
          select: {
            name: true,
            price: true
          }
        }
      }
    });

    // Get user's settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    const exportData = {
      user,
      products,
      orders,
      settings,
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=user-data-${userId}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ message: 'Error exporting data', error: error.message });
  }
});

// Get login history (mock data for now)
router.get('/login-history', requireAuth, async (req, res) => {
  try {
    // In a real app, you'd store login history in a separate table
    // For now, return mock data
    const mockHistory = [
      {
        id: 1,
        device: 'Chrome on Windows',
        location: 'New York, US',
        ip: '192.168.1.1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        success: true
      },
      {
        id: 2,
        device: 'Mobile Safari on iPhone',
        location: 'New York, US',
        ip: '192.168.1.1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        success: true
      },
      {
        id: 3,
        device: 'Firefox on Linux',
        location: 'London, UK',
        ip: '203.0.113.1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
        success: true
      }
    ];

    res.json({ history: mockHistory });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({ message: 'Error fetching login history', error: error.message });
  }
});

// Deactivate account
router.post('/deactivate', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Error deactivating account', error: error.message });
  }
});

// Delete account (soft delete - mark as deleted)
router.delete('/delete', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // In a real app, you'd want to anonymize data instead of hard delete
    // For now, we'll mark as inactive and change email/username
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `deleted-${userId}@deleted.local`,
        username: `deleted-${userId}`,
        phone: null,
        bio: null,
        website: null,
        twitter: null,
        linkedin: null,
        github: null
      }
    });

    res.json({ message: 'Account deletion initiated. You will be logged out.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

module.exports = router;

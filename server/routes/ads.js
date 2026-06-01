const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Create ad campaign
router.post('/', requireAuth, [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('adType').isIn(['BANNER', 'SPONSORED', 'TELEGRAM', 'POPUP']),
  body('budget').isFloat({ min: 0.01 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('link').optional().isURL(),
  body('imageUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, adType, budget, startDate, endDate, link, imageUrl } = req.body;

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.userId }
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    if (parseFloat(wallet.balance) < parseFloat(budget)) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create ad
    const ad = await prisma.ad.create({
      data: {
        advertiserId: req.user.userId,
        title,
        description,
        adType,
        budget: parseFloat(budget),
        link,
        imageUrl,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'PENDING'
      }
    });

    // Hold budget (deduct from wallet)
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: parseFloat(budget)
        }
      }
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        walletId: wallet.id,
        type: 'PAYMENT',
        amount: parseFloat(budget),
        status: 'COMPLETED',
        paymentMethod: 'INTERNAL',
        description: `Ad Campaign: ${title}`,
        metadata: { adId: ad.id }
      }
    });

    res.status(201).json({
      message: 'Ad campaign created. Pending approval.',
      ad
    });
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({ message: 'Error creating ad', error: error.message });
  }
});

// Get ads (for display)
router.get('/', async (req, res) => {
  try {
    const { adType, status = 'ACTIVE' } = req.query;

    const where = {};
    if (adType) where.adType = adType;
    if (status) where.status = status;

    const ads = await prisma.ad.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ ads });
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({ message: 'Error fetching ads', error: error.message });
  }
});

// Track ad impression
router.post('/:adId/impression', async (req, res) => {
  try {
    const { adId } = req.params;

    await prisma.ad.update({
      where: { id: adId },
      data: {
        impressions: {
          increment: 1
        }
      }
    });

    res.json({ message: 'Impression tracked' });
  } catch (error) {
    console.error('Track impression error:', error);
    res.status(500).json({ message: 'Error tracking impression', error: error.message });
  }
});

// Track ad click
router.post('/:adId/click', async (req, res) => {
  try {
    const { adId } = req.params;

    await prisma.ad.update({
      where: { id: adId },
      data: {
        clicks: {
          increment: 1
        }
      }
    });

    res.json({ message: 'Click tracked' });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ message: 'Error tracking click', error: error.message });
  }
});

module.exports = router;


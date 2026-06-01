const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const axios = require('axios');
const smmService = require('../services/smmService');
const { Prisma } = require('@prisma/client');

// Cache for services (in-memory, consider Redis for production)
let servicesCache = {
  timestamp: 0,
  data: null,
  hierarchical: null,
  mainCategories: null,
  provider: null
};
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

function normalizeProvider({ provider, server }) {
  if (server === '1' || server === 'Server 1') return 'N1PANEL';
  if (server === '2' || server === 'Server 2') return 'JUSTANOTHERPANEL';
  return provider || 'N1PANEL';
}

function getQuantityIncrement(service) {
  const inc = parseInt(
    service?.increment ??
    service?.quantity_increment ??
    service?.qty_increment ??
    service?.step ??
    1
  );
  return Number.isFinite(inc) && inc > 0 ? inc : 1;
}

function getProfitMargin(rateUsdPer1k) {
  const rate = Number(rateUsdPer1k) || 0;

  // Returns a multiplier (not a percent margin)
  // < $1: 10x at $0.001 and below, down to 3x at $1
  if (rate < 1) {
    const clamped = Math.max(0.001, rate);
    const ratio = (clamped - 0.001) / (1 - 0.001);
    return 10 - (10 - 3) * Math.max(0, Math.min(ratio, 1));
  }

  // $1-$5: 3x at $1 down to 2.5x at $5
  if (rate < 5) {
    const ratio = (rate - 1) / (5 - 1);
    return 3 - (3 - 2.5) * Math.max(0, Math.min(ratio, 1));
  }

  // $5-$50: 2.5x at $5 down to 2x at $50
  if (rate < 50) {
    const ratio = (rate - 5) / (50 - 5);
    return 2.5 - (2.5 - 2) * Math.max(0, Math.min(ratio, 1));
  }

  // $50-$200: 2x at $50 down to 1.5x at $200
  if (rate < 200) {
    const ratio = (rate - 50) / (200 - 50);
    return 2 - (2 - 1.5) * Math.max(0, Math.min(ratio, 1));
  }

  // $200+: 1.5x
  return 1.5;
}

function buildHierarchical(services) {
  const MAIN_CATEGORIES = [
    'Instagram',
    'Facebook',
    'YouTube',
    'X',
    'Spotify',
    'TikTok',
    'LinkedIn',
    'Google',
    'Telegram',
    'Discord',
    'Snapchat',
    'Twitch',
    'Pinterest',
    'Reddit',
    'Website Traffic',
    'Reviews'
  ];

  const categoryMapping = {
    instagram: 'Instagram',
    ig: 'Instagram',
    insta: 'Instagram',

    facebook: 'Facebook',
    fb: 'Facebook',
    meta: 'Facebook',

    youtube: 'YouTube',
    yt: 'YouTube',

    twitter: 'X',
    x: 'X',
    tweet: 'X',

    spotify: 'Spotify',

    tiktok: 'TikTok',
    'tik tok': 'TikTok',
    tt: 'TikTok',

    linkedin: 'LinkedIn',
    'linked in': 'LinkedIn',

    google: 'Google',
    gmail: 'Google',

    telegram: 'Telegram',
    tg: 'Telegram',

    discord: 'Discord',
    dc: 'Discord',

    snapchat: 'Snapchat',
    snap: 'Snapchat',
    sc: 'Snapchat',

    twitch: 'Twitch',

    pinterest: 'Pinterest',
    pin: 'Pinterest',

    reddit: 'Reddit',
    'upvote': 'Reddit',

    'website traffic': 'Website Traffic',
    website: 'Website Traffic',
    traffic: 'Website Traffic',

    reviews: 'Reviews',
    review: 'Reviews',
    rating: 'Reviews',
    trustpilot: 'Reviews',
    yelp: 'Reviews'
  };

  const typeKeywords = {
    Followers: ['follower', 'followers', 'subscriber', 'subscribers', 'fan', 'fans'],
    Likes: ['like', 'likes', 'heart'],
    Comments: ['comment', 'comments', 'reply', 'replies'],
    Views: ['view', 'views', 'watch', 'watching'],
    Shares: ['share', 'shares', 'retweet', 'repost', 'forward'],
    Members: ['member', 'members', 'group member', 'channel member', 'join'],
    Bots: ['bot', 'bots', 'bot start', 'start bot'],
    Watchtime: ['watchtime', 'watch time', 'hours', 'watch hours'],
    'Live Stream': ['live', 'stream', 'livestream'],
    Reactions: ['reaction', 'reactions', 'emoji', 'react'],
    Saves: ['save', 'saves', 'bookmark', 'favorite'],
    Impressions: ['impression', 'impressions', 'reach', 'exposure'],
    Clicks: ['click', 'clicks', 'tap', 'visit'],
    Engagement: ['engagement', 'interaction'],
    Plays: ['play', 'plays', 'listen', 'listens'],
    Downloads: ['download', 'downloads', 'dl']
  };

  const normalizeCategory = (category) => {
    if (!category) return 'Reviews';
    const normalized = String(category).trim().toLowerCase();
    if (categoryMapping[normalized]) return categoryMapping[normalized];
    for (const [key, mainCat] of Object.entries(categoryMapping)) {
      if (normalized.includes(key)) return mainCat;
    }
    for (const mainCat of MAIN_CATEGORIES) {
      if (normalized === mainCat.toLowerCase()) return mainCat;
    }
    return 'Reviews';
  };

  const getTypeGroup = (serviceName) => {
    const nameLower = String(serviceName || '').toLowerCase();
    for (const [group, keywords] of Object.entries(typeKeywords)) {
      for (const keyword of keywords) {
        if (nameLower.includes(keyword)) return group;
      }
    }
    return 'Other';
  };

  const hierarchical = {};
  const mainCategoriesSet = new Set();

  services.forEach((service) => {
    const mainCategory = normalizeCategory(service.category);
    const subcategory = `${mainCategory} Services`;
    const typeGroup = getTypeGroup(service.name);

    if (!hierarchical[mainCategory]) {
      hierarchical[mainCategory] = {};
      mainCategoriesSet.add(mainCategory);
    }
    if (!hierarchical[mainCategory][subcategory]) hierarchical[mainCategory][subcategory] = {};
    if (!hierarchical[mainCategory][subcategory][typeGroup]) hierarchical[mainCategory][subcategory][typeGroup] = [];
    hierarchical[mainCategory][subcategory][typeGroup].push(service);
  });

  const mainCategories = MAIN_CATEGORIES.filter((c) => mainCategoriesSet.has(c));

  return { hierarchical, mainCategories };
}

// Get available SMM services from database
router.get('/services', requireAuth, async (req, res) => {
  try {
    const provider = normalizeProvider(req.query);
    const { refresh = 'false' } = req.query;
    const shouldRefresh = refresh === 'true';
    const serverId = provider === 'N1PANEL' ? 1 : 2;
    const now = Date.now();

    // Optionally sync with provider
    if (shouldRefresh) {
      try {
        console.log(`[SMM] Syncing services for ${provider} (serverId: ${serverId})`);
        await smmService.syncServices(serverId);
      } catch (syncError) {
        console.error(`[SMM] Sync failed for ${provider}:`, syncError.message);
        // Continue to return cached data from DB
      }
    }

    // Fetch services from database
    const dbServices = await smmService.getServicesFromDB(serverId);

    if (dbServices.length === 0 && !shouldRefresh) {
      // No services in DB, try syncing
      try {
        console.log(`[SMM] No services in DB for ${provider}, triggering sync...`);
        await smmService.syncServices(serverId);
        const refreshedServices = await smmService.getServicesFromDB(serverId);
        dbServices.push(...refreshedServices);
      } catch (syncError) {
        console.error(`[SMM] Auto-sync failed for ${provider}:`, syncError.message);
      }
    }

    // Transform DB services to frontend format with profit margin
    const transformedServices = dbServices.map(service => ({
      id: service.id, // Use DB ID for ordering
      dbId: service.id,
      providerServiceId: service.providerServiceId, // Original provider ID
      service: service.providerServiceId,
      name: service.name,
      category: service.category,
      type: service.type || 'Default',
      // Apply profit margin to rate
      rate: (parseFloat(service.rate) || 0) * getProfitMargin(parseFloat(service.rate)),
      min: service.min,
      max: service.max,
      increment: service.increment,
      description: service.description || '',
      provider,
      serverId,
      dripfeed: service.dripfeed,
      refill: service.refill,
      cancel: service.cancel,
      lastSyncedAt: service.lastSyncedAt
    }));

    const { hierarchical, mainCategories } = buildHierarchical(transformedServices);

    res.json({
      success: true,
      provider,
      serverId,
      services: transformedServices,
      hierarchical,
      mainCategories,
      timestamp: now,
      count: transformedServices.length,
      synced: shouldRefresh
    });
  } catch (error) {
    console.error('Get SMM services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create SMM order
router.post('/orders', requireAuth, [
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('link').notEmpty().isString().withMessage('Link is required')
], async (req, res) => {
  console.log('[SMM] ========== ORDER ROUTE START ==========');
  
  // Input validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const { 
    serviceId, // This is the DB ID of the SMMService
    quantity, 
    link
  } = req.body;

  console.log('[SMM] Order request:', { serviceId, quantity, link: link?.slice(0, 80) });

  // Start a database transaction
  return await prisma.$transaction(async (tx) => {
    try {
      // 1. Get the service from database
      const dbService = await tx.sMMService.findUnique({
        where: { id: serviceId }
      });

      if (!dbService) {
        return res.status(404).json({
          success: false,
          message: 'Service not found in database'
        });
      }

      console.log('[SMM] Found service in DB:', {
        id: dbService.id,
        name: dbService.name,
        serverId: dbService.serverId,
        providerServiceId: dbService.providerServiceId
      });

      // 2. Validate quantity against service limits
      if (quantity < dbService.min || quantity > dbService.max) {
        return res.status(400).json({
          success: false,
          message: `Quantity must be between ${dbService.min} and ${dbService.max}`
        });
      }

      if (dbService.increment > 1 && quantity % dbService.increment !== 0) {
        return res.status(400).json({
          success: false,
          message: `Quantity must be divisible by ${dbService.increment}`
        });
      }

      // 3. Calculate price with profit margin
      const rateUsdPer1k = parseFloat(dbService.rate) || 0.01;
      const multiplier = getProfitMargin(rateUsdPer1k);
      const totalUsd = (rateUsdPer1k * multiplier) * (quantity / 1000);
      const totalPrice = new Prisma.Decimal(Math.ceil(totalUsd * 100) / 100);

      console.log('[SMM] Price calculation:', {
        rateUsdPer1k,
        multiplier,
        quantity,
        totalUsd,
        totalPrice: totalPrice.toString()
      });

      // 4. Get user's wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId: req.user.userId },
        select: { id: true, balance: true }
      });

      if (!wallet) {
        return res.status(404).json({ 
          success: false, 
          message: 'Wallet not found' 
        });
      }

      // 5. Check balance
      const walletBalance = new Prisma.Decimal(wallet.balance?.toString?.() ?? String(wallet.balance ?? 0));
      if (walletBalance.lt(totalPrice)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient balance',
          required: totalPrice.toString(),
          available: walletBalance.toString()
        });
      }

      // 6. Create order in database (PENDING status)
      const order = await tx.sMMOrder.create({
        data: {
          userId: req.user.userId,
          smmServiceId: dbService.id,
          serviceId: dbService.providerServiceId, // Provider's original ID
          serviceName: dbService.name,
          provider: dbService.serverId === 1 ? 'N1PANEL' : 'JUSTANOTHERPANEL',
          quantity,
          price: totalPrice,
          link,
          status: 'PENDING'
        }
      });

      console.log('[SMM] Order created in DB:', { orderId: order.id });

      // 7. Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: totalPrice } }
      });

      // 8. Create transaction record
      await tx.transaction.create({
        data: {
          userId: req.user.userId,
          walletId: wallet.id,
          type: 'PAYMENT',
          amount: totalPrice,
          status: 'PENDING',
          paymentMethod: 'INTERNAL',
          description: `SMM Order: ${dbService.name}`,
          metadata: { 
            orderId: order.id,
            smmServiceId: dbService.id,
            providerServiceId: dbService.providerServiceId,
            serverId: dbService.serverId
          }
        }
      });

      // 9. Submit to SMM panel
      try {
        const panelResponse = await smmService.createOrder(
          dbService.serverId,
          dbService.providerServiceId,
          quantity,
          link
        );

        console.log('[SMM] Panel order created:', {
          externalOrderId: panelResponse.orderId,
          status: panelResponse.status
        });

        // Update order with panel's response
        const updatedOrder = await tx.sMMOrder.update({
          where: { id: order.id },
          data: { 
            status: 'IN_PROGRESS',
            externalOrderId: String(panelResponse.orderId),
            panelResponse: panelResponse.providerResponse
          }
        });

        // Update transaction status
        await tx.transaction.updateMany({
          where: { 
            metadata: { path: ['orderId'], equals: order.id }
          },
          data: {
            status: 'COMPLETED',
            metadata: {
              orderId: order.id,
              externalOrderId: panelResponse.orderId,
              panelResponse: panelResponse.providerResponse
            }
          }
        });

        // Return success response
        return res.status(201).json({
          success: true,
          message: 'Order created successfully',
          order: {
            id: updatedOrder.id,
            serviceName: updatedOrder.serviceName,
            quantity: updatedOrder.quantity,
            price: updatedOrder.price,
            status: 'IN_PROGRESS',
            externalOrderId: panelResponse.orderId
          }
        });

      } catch (panelError) {
        console.error('[SMM] Panel order failed:', panelError);

        const errorDetails = {
          message: panelError.message,
          status: panelError.response?.status,
          data: panelError.response?.data
        };

        // Update order with error status
        await tx.sMMOrder.update({
          where: { id: order.id },
          data: { 
            status: 'FAILED',
            panelError: errorDetails
          }
        });

        // Refund the user
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: totalPrice } }
        });

        // Update transaction status
        await tx.transaction.updateMany({
          where: { 
            metadata: { path: ['orderId'], equals: order.id }
          },
          data: { 
            status: 'FAILED',
            metadata: { 
              orderId: order.id,
              error: errorDetails
            }
          }
        });

        return res.status(502).json({
          success: false,
          message: 'Failed to submit order to SMM provider',
          error: panelError.message,
          refunded: true
        });
      }

    } catch (error) {
      console.error('[SMM] Create order error:', error);
      throw error; // Will trigger transaction rollback
    }
  }).catch(error => {
    console.error('[SMM] Transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while processing your order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'INTERNAL_SERVER_ERROR'
    });
  });
});

// Get user's SMM orders
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.sMMOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.sMMOrder.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get SMM orders error:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

function normalizeOrderStatus(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return 'PENDING';
  if (s.includes('complete')) return 'COMPLETED';
  if (s.includes('in progress') || s.includes('progress') || s.includes('processing') || s.includes('running')) return 'IN_PROGRESS';
  if (s.includes('partial')) return 'PARTIAL';
  if (s.includes('cancel')) return 'CANCELLED';
  if (s.includes('fail') || s.includes('error')) return 'FAILED';
  if (s.includes('pending') || s.includes('await')) return 'PENDING';
  return s.toUpperCase().replace(/\s+/g, '_');
}

// Refresh an order's status from the provider
router.post('/orders/:id/refresh', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.sMMOrder.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.externalOrderId) {
      return res.status(400).json({ message: 'Order has no externalOrderId yet' });
    }

    const provider = order.provider || 'N1PANEL';
    let statusDetails;
    if (provider === 'N1PANEL') {
      statusDetails = await smmService.getN1PanelOrderStatus(order.externalOrderId);
    } else {
      statusDetails = await smmService.getJustAnotherPanelOrderStatus(order.externalOrderId);
    }

    const nextStatus = normalizeOrderStatus(statusDetails?.status);
    const updated = await prisma.sMMOrder.update({
      where: { id: order.id },
      data: { status: nextStatus }
    });

    return res.json({
      order: updated,
      providerStatus: statusDetails
    });
  } catch (error) {
    console.error('Refresh SMM order status error:', error);
    return res.status(500).json({ message: 'Error refreshing order status', error: error.message });
  }
});

module.exports = router;


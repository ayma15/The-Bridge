const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { requireAuth } = require('../middleware/auth');

/**
 * Global Search Route
 * Searches across products, freelancer services, users, ads, and more
 */

// Global search
router.get('/', [
  query('q').notEmpty().isLength({ min: 1, max: 100 }),
  query('type').optional().isIn(['all', 'products', 'services', 'freelancers', 'users', 'ads']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    const searchQuery = q.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const results = {
      query: searchQuery,
      products: [],
      services: [],
      freelancers: [],
      users: [],
      ads: [],
      total: 0
    };

    // Search products
    if (type === 'all' || type === 'products') {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { category: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              publicId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: type === 'products' ? skip : 0
      });
      results.products = products;
    }

    // Search freelancer services
    if (type === 'all' || type === 'services') {
      const services = await prisma.freelancerService.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { category: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              publicId: true
            }
          },
          profile: {
            select: {
              rating: true,
              totalReviews: true,
              telegramChannel: true,
              displayName: true,
              profilePhotoUrl: true,
              availability: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: type === 'services' ? skip : 0
      });
      results.services = services;
    }

    // Search freelancers (profiles)
    if (type === 'all' || type === 'freelancers') {
      const freelancers = await prisma.freelancerProfile.findMany({
        where: {
          OR: [
            { bio: { contains: searchQuery, mode: 'insensitive' } },
            {
              user: {
                OR: [
                  { username: { contains: searchQuery, mode: 'insensitive' } },
                  { email: { contains: searchQuery, mode: 'insensitive' } }
                ]
              }
            }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              publicId: true
            }
          },
          services: {
            where: { isActive: true },
            take: 3,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { rating: 'desc' },
        take: parseInt(limit),
        skip: type === 'freelancers' ? skip : 0
      });
      results.freelancers = freelancers;
    }

    // Search ads
    if (type === 'all' || type === 'ads') {
      const ads = await prisma.ad.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { adType: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        include: {
          advertiser: {
            select: {
              id: true,
              username: true,
              publicId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: type === 'ads' ? skip : 0
      });
      results.ads = ads;
    }

    // Search users (only if authenticated)
    if ((type === 'all' || type === 'users') && req.user) {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { username: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          username: true,
          email: true,
          publicId: true,
          freelancerProfile: {
            select: {
              rating: true,
              totalReviews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: type === 'users' ? skip : 0
      });
      results.users = users;
    }

    // Calculate totals
    if (type === 'all') {
      results.total = results.products.length + results.services.length + 
                     results.freelancers.length + results.users.length + results.ads.length;
    } else if (type === 'products') {
      const count = await prisma.product.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { category: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      });
      results.total = count;
    } else if (type === 'services') {
      const count = await prisma.freelancerService.count({
        where: {
          isActive: true,
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { category: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      });
      results.total = count;
    } else if (type === 'freelancers') {
      const count = await prisma.freelancerProfile.count({
        where: {
          OR: [
            { bio: { contains: searchQuery, mode: 'insensitive' } },
            {
              user: {
                OR: [
                  { username: { contains: searchQuery, mode: 'insensitive' } },
                  { email: { contains: searchQuery, mode: 'insensitive' } }
                ]
              }
            }
          ]
        }
      });
      results.total = count;
    } else if (type === 'ads') {
      const count = await prisma.ad.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { adType: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      });
      results.total = count;
    } else if (type === 'users') {
      const count = await prisma.user.count({
        where: {
          isActive: true,
          OR: [
            { username: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      });
      results.total = count;
    }

    res.json({
      ...results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.total,
        pages: Math.ceil(results.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error performing search', error: error.message });
  }
});

// Get search suggestions (autocomplete)
router.get('/suggestions', [
  query('q').notEmpty().isLength({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q } = req.query;
    const searchQuery = q.trim();

    // Get suggestions from products, services, and ads
    const [productNames, serviceTitles, adTitles, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          name: { contains: searchQuery, mode: 'insensitive' }
        },
        select: { name: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.freelancerService.findMany({
        where: {
          isActive: true,
          title: { contains: searchQuery, mode: 'insensitive' }
        },
        select: { title: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ad.findMany({
        where: {
          status: 'ACTIVE',
          title: { contains: searchQuery, mode: 'insensitive' }
        },
        select: { title: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
          category: { contains: searchQuery, mode: 'insensitive' }
        },
        select: { category: true },
        distinct: ['category'],
        take: 5
      })
    ]);

    const suggestions = [
      ...productNames.map(p => ({ text: p.name, type: 'product' })),
      ...serviceTitles.map(s => ({ text: s.title, type: 'service' })),
      ...adTitles.map(a => ({ text: a.title, type: 'ad' })),
      ...categories.map(c => ({ text: c.category, type: 'category' }))
    ].slice(0, 10);

    res.json({ suggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Error fetching suggestions', error: error.message });
  }
});

module.exports = router;


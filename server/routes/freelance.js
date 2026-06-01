const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const name = `avatar_${req.user?.userId || Date.now()}_${Date.now()}${ext}`;
      cb(null, name);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Invalid file type'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Create/Update freelancer profile
router.post('/profile', requireAuth, [
  body('bio').optional().isString(),
  body('skills').optional().isArray(),
  body('telegramChannel').optional().isString(),
  // New extended fields
  body('displayName').optional().isString(),
  body('contactEmail').optional().isEmail(),
  body('contactPhone').optional().isString(),
  body('profilePhotoUrl')
    .optional()
    .custom((value) => {
      if (!value) return true;
      if (typeof value !== 'string') return false;
      if (value.startsWith('/uploads/')) return true;
      return /^https?:\/\//i.test(value);
    })
    .withMessage('profilePhotoUrl must be a full URL or a /uploads/... path'),
  body('availability').optional().isString(),
  body('experience').optional().isString(),
  body('yearsOfExperience').optional().isInt({ min: 0 }),
  body('portfolioLinks').optional().isArray(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array();
      const message = validationErrors[0]?.msg || 'Invalid data provided';
      return res.status(400).json({ message, errors: validationErrors });
    }

    const { bio, skills, telegramChannel, displayName, contactEmail, contactPhone, profilePhotoUrl, availability, experience, yearsOfExperience, portfolioLinks } = req.body;

    const profile = await prisma.freelancerProfile.upsert({
      where: { userId: req.user.userId },
      update: {
        bio,
        skills: skills || [],
        telegramChannel,
        displayName,
        contactEmail,
        contactPhone,
        profilePhotoUrl,
        availability,
        experience,
        yearsOfExperience: yearsOfExperience !== undefined ? parseInt(yearsOfExperience) : undefined,
        portfolioLinks: portfolioLinks || [],
      },
      create: {
        userId: req.user.userId,
        bio,
        skills: skills || [],
        telegramChannel,
        displayName,
        contactEmail,
        contactPhone,
        profilePhotoUrl,
        availability,
        experience,
        yearsOfExperience: yearsOfExperience !== undefined ? parseInt(yearsOfExperience) : undefined,
        portfolioLinks: portfolioLinks || [],
      }
    });

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

router.post('/profile/photo', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading photo', error: error.message });
  }
});

// Get freelancer profile
router.get('/profile/:userId?', requireAuth, async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;

    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        services: {
          where: { isActive: true }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Create freelancer service
router.post('/services', requireAuth, [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('category').notEmpty(),
  body('price').isFloat({ min: 0.01 }),
  body('deliveryTime').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Require a completed freelancer profile before creating services
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!profile || ((!profile.bio || profile.bio.trim() === '') && (!Array.isArray(profile.skills) || profile.skills.length === 0))) {
      return res.status(400).json({ message: 'Please complete your freelancer profile before creating services.' });
    }

    const { title, description, category, price, deliveryTime } = req.body;

    const service = await prisma.freelancerService.create({
      data: {
        freelancerId: req.user.userId,
        title,
        description,
        category,
        price: parseFloat(price),
        deliveryTime: parseInt(deliveryTime)
      }
    });

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Error creating service', error: error.message });
  }
});

// Get freelancer services
router.get('/services', async (req, res) => {
  try {
    const { freelancerId, category, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };
    if (freelancerId) where.freelancerId = freelancerId;
    if (category) where.category = category;

    const [services, total] = await Promise.all([
      prisma.freelancerService.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          },
          profile: {
            select: {
              rating: true,
              totalReviews: true,
              displayName: true,
              profilePhotoUrl: true,
              availability: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.freelancerService.count({ where })
    ]);

    res.json({
      services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
});

// Create order
router.post('/orders', requireAuth, [
  body('serviceId').notEmpty(),
  body('requirements').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { serviceId, requirements } = req.body;

    const service = await prisma.freelancerService.findUnique({
      where: { id: serviceId },
      include: { user: true }
    });

    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.freelancerId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot order your own service' });
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.userId }
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Check balance
    if (parseFloat(wallet.balance) < parseFloat(service.price)) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create order
    const order = await prisma.freelancerOrder.create({
      data: {
        serviceId,
        freelancerId: service.freelancerId,
        clientId: req.user.userId,
        price: service.price,
        requirements,
        status: 'PENDING'
      }
    });

    // Hold funds (deduct from wallet)
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: service.price
        }
      }
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        walletId: wallet.id,
        type: 'PAYMENT',
        amount: service.price,
        status: 'COMPLETED',
        paymentMethod: 'INTERNAL',
        description: `Freelancer Order: ${service.title}`,
        metadata: { orderId: order.id }
      }
    });

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

module.exports = router;


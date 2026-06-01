const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { isValidCategory, getAllCategories } = require('../utils/categories');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Boost options configuration
const BOOST_OPTIONS = {
  basic: { duration: 7, price: 5.00 },
  premium: { duration: 14, price: 9.00 },
  ultimate: { duration: 30, price: 15.00 }
};

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MAX_IMAGE_MB = 5;

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    }
  }),
  limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// Upload a product image (returns public URL)
router.post('/upload', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const message = err.message || 'Upload failed';
      if (String(message).toLowerCase().includes('file too large')) {
        return res.status(413).json({ message: `Image too large. Max ${MAX_IMAGE_MB}MB.` });
      }
      if (String(message).toLowerCase().includes('only image')) {
        return res.status(400).json({ message: 'Only image files are allowed' });
      }
      return res.status(400).json({ message });
    }

    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const url = `/uploads/products/${req.file.filename}`;
    return res.status(201).json({ url, maxMb: MAX_IMAGE_MB });
  });
});

// Create product listing
router.post('/', requireAuth, [
  body('name').notEmpty(),
  body('description').optional().isLength({ max: 10000 }), // Optional, max length
  body('category').notEmpty(),
  body('price').isFloat({ min: 0.01 }),
  body('stock').optional().isInt({ min: 0 }), // Optional, defaults to 0
  body('condition').optional().isIn(['BRAND_NEW', 'SLIGHTLY_USED', 'USED']),
  body('images').optional().isArray(),
  body('sellerPhone').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description = '', category, price, stock = 0, condition = 'BRAND_NEW', images = [], sellerPhone } = req.body;

    const seller = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, phone: true, sellerPhone: true }
    });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (sellerPhone && String(sellerPhone).trim()) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { sellerPhone: String(sellerPhone).trim() }
      });
    }

    const effectiveSellerPhone = (sellerPhone && String(sellerPhone).trim()) ? String(sellerPhone).trim() : (seller.sellerPhone || seller.phone);
    if (!effectiveSellerPhone) {
      return res.status(400).json({ message: 'Seller phone number is required' });
    }

    // Check if product creation should be restricted for non-verified users
    // For now, allow all users to create products

    // Validate category
    if (!isValidCategory(category)) {
      return res.status(400).json({ message: 'Invalid category. Please select from the allowed categories.' });
    }

    const product = await prisma.product.create({
      data: {
        sellerId: req.user.userId,
        name,
        description,
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
        condition,
        images
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    // Provide more detailed error message
    let errorMessage = 'Error creating product';
    let statusCode = 500;
    
    if (error.message && (error.message.includes('Unknown arg') || error.message.includes('condition') || error.message.includes('Unknown field'))) {
      errorMessage = 'Database migration required. The condition field is missing. Please run: npx prisma migrate dev --name add_product_condition';
      statusCode = 500;
    } else if (error.message && error.message.includes('Invalid value')) {
      errorMessage = 'Invalid category. Please select from the allowed categories.';
      statusCode = 400;
    } else if (error.code === 'P2002') {
      errorMessage = 'A product with this information already exists.';
      statusCode = 400;
    } else {
      errorMessage = error.message || 'Error creating product';
    }
    
    res.status(statusCode).json({ 
      message: errorMessage, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get products
router.get('/', async (req, res) => {
  try {
    const { category, sellerId, page = 1, limit = 20, search, condition, minPrice, maxPrice } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };
    if (category) where.category = category;
    if (sellerId) where.sellerId = sellerId;
    if (condition) where.condition = condition;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              publicId: true
            }
          }
        },
        orderBy: [
          { boostExpiresAt: { sort: 'desc', nulls: 'last' } }, // Boosted products first
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    // Add boost status and mockup flag to products
    const productsWithBoost = products.map(product => ({
      ...product,
      isBoosted: product.boostExpiresAt && new Date(product.boostExpiresAt) > new Date(),
      isMockup: product.seller.username === 'admin' // Mark admin products as mockup
    }));

    res.json({
      products: productsWithBoost,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Create product order
router.post('/orders', requireAuth, [
  body('productId').notEmpty(),
  body('quantity').isInt({ min: 1 }),
  body('shippingAddress').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity, shippingAddress } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const totalPrice = parseFloat(product.price) * quantity;

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.userId }
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    if (parseFloat(wallet.balance) < totalPrice) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create order
    const order = await prisma.productOrder.create({
      data: {
        productId,
        buyerId: req.user.userId,
        quantity,
        totalPrice,
        shippingAddress,
        status: 'PENDING'
      }
    });

    // Update stock
    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: quantity
        }
      }
    });

    // Deduct from wallet
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: totalPrice
        }
      }
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        walletId: wallet.id,
        type: 'PAYMENT',
        amount: totalPrice,
        status: 'COMPLETED',
        paymentMethod: 'INTERNAL',
        description: `Product Order: ${product.name}`,
        metadata: { orderId: order.id }
      }
    });

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create product order error:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            sellerPhone: true,
            sellerAddress: true,
            sellerTerms: true,
            publicId: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// Update product (seller only)
router.put('/:id', requireAuth, [
  body('name').optional().notEmpty(),
  body('description').optional().isLength({ max: 10000 }), // Optional, max length
  body('category').optional().notEmpty(),
  body('price').optional().isFloat({ min: 0.01 }),
  body('stock').optional().isInt({ min: 0 }), // Optional, min 0
  body('condition').optional().isIn(['BRAND_NEW', 'SLIGHTLY_USED', 'USED']),
  body('images').optional().isArray(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerId !== req.user.userId && req.user.role !== 'ADMIN' && req.user.role !== 'FULL_ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const { name, description = '', category, price, stock = 0, condition, images, isActive } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) {
      // Validate category
      if (!isValidCategory(category)) {
        return res.status(400).json({ message: 'Invalid category. Please select from the allowed categories.' });
      }
      updateData.category = category;
    }
    if (price !== undefined) updateData.price = parseFloat(price);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (condition !== undefined) updateData.condition = condition;
    if (images !== undefined) updateData.images = images;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            publicId: true
          }
        }
      }
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// Delete product (seller only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerId !== req.user.userId && req.user.role !== 'ADMIN' && req.user.role !== 'FULL_ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await prisma.product.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

// Get product categories (fixed list)
router.get('/categories/list', async (req, res) => {
  try {
    res.json({
      categories: getAllCategories()
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get user's orders
router.get('/orders/my', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { buyerId: req.user.userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.productOrder.findMany({
        where,
        include: {
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  username: true,
                  publicId: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.productOrder.count({ where })
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
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get seller's products
router.get('/seller/my', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { sellerId: req.user.userId },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              publicId: true
            }
          },
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.product.count({ where: { sellerId: req.user.userId } })
    ]);

    // Add boost status and mockup flag to products
    const productsWithBoost = products.map(product => ({
      ...product,
      isBoosted: product.boostExpiresAt && new Date(product.boostExpiresAt) > new Date(),
      boostExpiresAt: product.boostExpiresAt,
      isMockup: product.seller?.username === 'admin' // Mark admin products as mockup
    }));

    res.json({
      products: productsWithBoost,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Boost product
router.post('/boost', requireAuth, [
  body('productId').notEmpty(),
  body('boostOptionId').isIn(['basic', 'premium', 'ultimate']),
  body('duration').isInt({ min: 1, max: 365 }),
  body('price').isFloat({ min: 0.01 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, boostOptionId, duration, price } = req.body;

    // Verify product ownership
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerId !== req.user.userId) {
      return res.status(403).json({ message: 'You can only boost your own products' });
    }

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.userId }
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    if (parseFloat(wallet.balance) < parseFloat(price)) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Calculate boost expiration
    const boostExpiresAt = new Date();
    boostExpiresAt.setDate(boostExpiresAt.getDate() + parseInt(duration));

    // Update product with boost
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        boostExpiresAt,
        isBoosted: true
      }
    });

    // Deduct from wallet
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: parseFloat(price)
        }
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        walletId: wallet.id,
        type: 'PAYMENT',
        amount: parseFloat(price),
        status: 'COMPLETED',
        paymentMethod: 'INTERNAL',
        description: `Product Boost: ${product.name} (${boostOptionId})`,
        metadata: { productId, boostOptionId, duration }
      }
    });

    res.json({
      message: 'Product boosted successfully',
      product: {
        ...updatedProduct,
        isBoosted: true,
        boostExpiresAt
      }
    });
  } catch (error) {
    console.error('Boost product error:', error);
    res.status(500).json({ message: 'Error boosting product', error: error.message });
  }
});

module.exports = router;


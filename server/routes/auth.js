const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/database');
const { generatePublicId } = require('../utils/publicId');
const { generateToken, verifyToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');
const emailService = require('../utils/emailService');
const { logInfo, logError } = require('../utils/logger');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Forgot password (request reset email)
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond success to prevent user enumeration
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link will be sent.' });
    }

    if (!user.isActive) {
      return res.json({ message: 'If the email exists, a reset link will be sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpires: resetExpires
      }
    });

    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
      logInfo(`Password reset email sent to ${email}`);
    } catch (emailError) {
      logError(`Failed to send password reset email to ${email}:`, emailError);
      // Do not reveal email sending issues to user
    }

    return res.json({ message: 'If the email exists, a reset link will be sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset', error: error.message });
  }
});

// Reset password using token
router.post('/reset-password', [
  body('token').isString().isLength({ min: 10 }).withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    return res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// Register with email/phone
router.post('/register', [
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone, password, username, telegramId } = req.body;

    // At least one identifier required
    if (!email && !phone && !telegramId) {
      return res.status(400).json({ message: 'Email, phone, or Telegram ID required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
          telegramId ? { telegramId } : {}
        ].filter(obj => Object.keys(obj).length > 0)
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Generate verification token (but don't require verification)
    const emailVerificationToken = email ? crypto.randomBytes(32).toString('hex') : null;
    const emailVerificationExpires = email ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // 24 hours

    // Create user with optional email verification
    const baseCreateData = {
      email,
      phone,
      username,
      telegramId,
      passwordHash,
      role: 'USER',
      isActive: true,
      isVerified: !email,
      emailVerificationToken,
      emailVerificationExpires,
      passwordResetToken: null,
      passwordResetExpires: null
    };

    let user;
    try {
      user = await prisma.user.create({
        data: { ...baseCreateData, publicId: generatePublicId(username) },
        select: {
          id: true,
          email: true,
          username: true,
          publicId: true,
          role: true,
          isVerified: true
        }
      });
    } catch (e) {
      // Fallback if publicId column is not yet present
      user = await prisma.user.create({
        data: baseCreateData,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isVerified: true
        }
      });
    }

    // Send verification email (but don't block registration if it fails)
    if (email) {
      try {
        await emailService.sendVerificationEmail(user, emailVerificationToken);
        logInfo(`Verification email sent to ${email}`);
      } catch (error) {
        logError(`Failed to send verification email to ${email}:`, error);
        // Continue with registration even if email sending fails
      }
    }

    // Create wallet
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        currency: 'POINTS'
      }
    });

    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        publicId: user.publicId,
        phone: user.phone,
        telegramId: user.telegramId,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login
router.post('/login', [
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('phone').optional(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('telegramId').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const emailRaw = typeof req.body.email === 'string' ? req.body.email : undefined;
    const usernameRaw = typeof req.body.username === 'string' ? req.body.username : undefined;
    const phoneRaw = typeof req.body.phone === 'string' ? req.body.phone : undefined;
    const telegramId = req.body.telegramId;
    const password = req.body.password;

    const email = emailRaw ? emailRaw.trim().toLowerCase() : undefined;
    const username = usernameRaw ? usernameRaw.trim() : undefined;
    const phone = phoneRaw ? phoneRaw.trim() : undefined;

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
          telegramId ? { telegramId } : {},
          username ? { username } : {}
        ].filter(obj => Object.keys(obj).length > 0)
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password (if not Telegram login)
    if (!telegramId && password) {
      if (!user.passwordHash) {
        return res.status(401).json({ message: 'Password not set for this account' });
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        publicId: user.publicId,
        email: user.email,
        phone: user.phone,
        telegramId: user.telegramId,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Verify email endpoint
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: 'Verification token is required' 
      });
    }
    
    // Find user by verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date()
        }
      }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification token' 
      });
    }
    
    // Update user as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      },
      select: {
        id: true,
        email: true,
        username: true,
        isVerified: true,
        role: true
      }
    });
    
    // Generate new JWT with updated verification status
    const newToken = generateToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      token: newToken,
      user: updatedUser
    });
    
  } catch (error) {
    logError('Email verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify email' 
    });
  }
});

// Resend verification email
router.post('/resend-verification', requireAuth, async (req, res) => {
  try {
    const user = req.user;

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is already verified' 
      });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Update user with new verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires
      }
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user, emailVerificationToken);
      logInfo(`Resent verification email to ${user.email}`);
      
      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (emailError) {
      logError('Failed to resend verification email:', emailError);
      throw new Error('Failed to send verification email');
    }
    
  } catch (error) {
    logError('Resend verification error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to resend verification email' 
    });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let user;
    try {
      // Try with publicId (after migration)
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          publicId: true,
          email: true,
          username: true,
          phone: true,
          telegramId: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          bio: true,
          website: true,
          twitter: true,
          linkedin: true,
          github: true,
          sellerAddress: true,
          sellerTerms: true,
          sellerPhone: true
        }
      });
    } catch (e) {
      // Fallback before migration (no publicId column yet)
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          phone: true,
          telegramId: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          bio: true,
          website: true,
          twitter: true,
          linkedin: true,
          github: true,
          sellerAddress: true,
          sellerTerms: true,
          sellerPhone: true
        }
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add verification status
    const needsVerification = user.email && !user.isVerified;
    
    // Return consistent shape the client can handle
    res.json({
      user,
      needsVerification
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user profile
router.put('/profile', requireAuth, [
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('phone').optional().custom((value) => {
    if (!value) return true; // Allow empty phone
    // Basic phone validation - allow various formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
      throw new Error('Invalid phone number format');
    }
    return true;
  }),
  body('sellerPhone').optional(),
  body('sellerAddress').optional(),
  body('sellerTerms').optional()
], async (req, res) => {
  try {
    console.log('Profile update request received:', {
      userId: req.user.userId,
      body: req.body
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      // Return more specific error message
      const validationErrors = errors.array();
      const errorMessage = validationErrors.length > 0 ? validationErrors[0].msg : 'Invalid data provided';
      return res.status(400).json({ message: errorMessage, errors: validationErrors });
    }

    const { username, phone, bio, website, twitter, linkedin, github, sellerPhone, sellerAddress, sellerTerms } = req.body;
    const updateData = {};

    if (username !== undefined) {
      console.log('Checking username availability for:', username);
      // Check if username is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: req.user.userId }
        }
      });

      if (existingUser) {
        console.log('Username already taken by:', existingUser.id);
        return res.status(400).json({ message: 'Username already taken' });
      }
      updateData.username = username;
    }

    if (phone !== undefined) {
      console.log('Checking phone availability for:', phone);
      // Check if phone is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: req.user.userId }
        }
      });

      if (existingUser) {
        console.log('Phone already taken by:', existingUser.id);
        return res.status(400).json({ message: 'Phone number already in use' });
      }
      updateData.phone = phone;
    }

    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (twitter !== undefined) updateData.twitter = twitter;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (github !== undefined) updateData.github = github;
    if (sellerPhone !== undefined) updateData.sellerPhone = sellerPhone;
    if (sellerAddress !== undefined) updateData.sellerAddress = sellerAddress;
    if (sellerTerms !== undefined) updateData.sellerTerms = sellerTerms;

    console.log('Updating user with data:', updateData);

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData
    });

    console.log('Profile updated successfully for user:', user.id);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        telegramId: user.telegramId,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        bio: user.bio,
        website: user.website,
        twitter: user.twitter,
        linkedin: user.linkedin,
        github: user.github,
        sellerPhone: user.sellerPhone,
        sellerAddress: user.sellerAddress,
        sellerTerms: user.sellerTerms,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router;


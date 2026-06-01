const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const prismaClient = require('../config/database');

const ALLOWED_CURRENCIES = ['ETB', 'USD'];
const ALLOWED_MANUAL_PAYMENT_METHODS = ['TELEBIRR', 'CBEBIRR', 'CBE'];

async function getOrCreateWallet(userId) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      balance: 0,
      currency: 'USD'
    }
  });
}

// Get wallet balance
router.get('/balance', requireAuth, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.userId);

    res.json({
      balance: wallet.balance.toString(),
      currency: wallet.currency
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Error fetching balance', error: error.message });
  }
});

// Get transaction history
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.userId
    };

    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// Deposit request (creates pending transaction)
router.post('/deposit', requireAuth, [
  body('amount').isFloat({ min: 0.01 }),
  body('paymentMethod').isIn(ALLOWED_MANUAL_PAYMENT_METHODS),
  body('currency').isIn(ALLOWED_CURRENCIES),
  body('reference').optional().isString().isLength({ min: 2, max: 120 }),
  body('note').optional().isString().isLength({ min: 2, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethod, currency, reference, note } = req.body;

    const wallet = await getOrCreateWallet(req.user.userId);

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: parseFloat(amount),
        currency,
        status: 'PENDING',
        paymentMethod,
        description: `Deposit via ${paymentMethod}`,
        metadata: {
          reference: reference || null,
          note: note || null,
          requestedAt: new Date().toISOString()
        }
      }
    });

    // Here you would integrate with payment gateway
    // For now, return transaction ID for manual processing
    res.status(201).json({
      message: 'Deposit request created',
      transaction: {
        id: transaction.id,
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod
      },
      // Payment gateway integration would return payment URL here
      paymentUrl: null // To be implemented in payment service
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Error creating deposit', error: error.message });
  }
});

// Withdrawal request
router.post('/withdraw', requireAuth, [
  body('amount').isFloat({ min: 0.01 }),
  body('paymentMethod').isIn(ALLOWED_MANUAL_PAYMENT_METHODS),
  body('currency').isIn(ALLOWED_CURRENCIES),
  body('paymentDetails').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethod, paymentDetails, currency } = req.body;

    const wallet = await getOrCreateWallet(req.user.userId);

    // Check sufficient balance
    const currentBalance = parseFloat(wallet.balance.toString());
    if (currentBalance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create pending withdrawal transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        amount: parseFloat(amount),
        currency,
        status: 'PENDING',
        paymentMethod,
        description: `Withdrawal via ${paymentMethod}`,
        metadata: {
          paymentDetails,
          requestedAt: new Date().toISOString()
        }
      }
    });

    // Note: Actual withdrawal processing would be handled by admin or automated service
    res.status(201).json({
      message: 'Withdrawal request created. Pending admin approval.',
      transaction: {
        id: transaction.id,
        amount: transaction.amount.toString(),
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Error creating withdrawal', error: error.message });
  }
});

router.get('/admin/deposits', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      type: 'DEPOSIT'
    };
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          },
          wallet: {
            select: {
              id: true,
              userId: true,
              currency: true,
              balance: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Admin deposits error:', error);
    res.status(500).json({ message: 'Error fetching deposits', error: error.message });
  }
});

router.post('/admin/deposits/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.findUnique({
        where: { id }
      });

      if (!t || t.type !== 'DEPOSIT') {
        return { status: 404, body: { message: 'Deposit transaction not found' } };
      }

      if (t.status !== 'PENDING') {
        return { status: 400, body: { message: `Deposit is not pending (current status: ${t.status})` } };
      }

      if (!ALLOWED_CURRENCIES.includes(t.currency) || !ALLOWED_MANUAL_PAYMENT_METHODS.includes(t.paymentMethod)) {
        return { status: 400, body: { message: 'Deposit has invalid currency or payment method' } };
      }

      const wallet = await tx.wallet.findUnique({ where: { id: t.walletId } });
      if (!wallet) {
        return { status: 404, body: { message: 'Wallet not found' } };
      }

      const walletCurrency = wallet.currency || 'USD';
      const walletBalance = parseFloat(wallet.balance.toString());

      if (walletCurrency !== 'USD' && walletCurrency !== t.currency && walletBalance > 0) {
        return { status: 400, body: { message: `Wallet currency mismatch (wallet: ${walletCurrency}, deposit: ${t.currency})` } };
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: t.amount },
          currency: walletCurrency === 'USD' ? t.currency : wallet.currency
        }
      });

      const updated = await tx.transaction.update({
        where: { id: t.id },
        data: {
          status: 'COMPLETED',
          metadata: {
            ...(t.metadata || {}),
            approvedAt: new Date().toISOString()
          }
        }
      });

      return { status: 200, body: { message: 'Deposit approved', transaction: updated } };
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ message: 'Error approving deposit', error: error.message });
  }
});

router.post('/admin/deposits/:id/reject', requireAuth, requireAdmin, [
  body('reason').optional().isString().isLength({ min: 2, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const t = await prisma.transaction.findUnique({ where: { id } });
    if (!t || t.type !== 'DEPOSIT') {
      return res.status(404).json({ message: 'Deposit transaction not found' });
    }

    if (t.status !== 'PENDING') {
      return res.status(400).json({ message: `Deposit is not pending (current status: ${t.status})` });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status: 'FAILED',
        metadata: {
          ...(t.metadata || {}),
          rejectedAt: new Date().toISOString(),
          rejectReason: reason || null
        }
      }
    });

    return res.json({ message: 'Deposit rejected', transaction: updated });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ message: 'Error rejecting deposit', error: error.message });
  }
});

module.exports = router;

// Internal transfer: send funds to another user by recipientPublicId
router.post('/transfer', requireAuth, [
  body('recipientPublicId').isString().isLength({ min: 5 }),
  body('amount').isFloat({ min: 0.01 }),
  body('currency').isIn(ALLOWED_CURRENCIES)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientPublicId, amount, currency } = req.body;

    // Find recipient by publicId. This requires DB migration adding User.publicId
    let recipient;
    try {
      recipient = await prismaClient.user.findUnique({ where: { publicId: recipientPublicId } });
    } catch (e) {
      return res.status(501).json({ message: 'Transfers by publicId not available until database migration is applied.' });
    }

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (recipient.id === req.user.userId) {
      return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    // Ensure wallets
    const [senderWallet, recipientWallet] = await Promise.all([
      getOrCreateWallet(req.user.userId),
      getOrCreateWallet(recipient.id)
    ]);

    // Validate currency
    const senderCurrency = senderWallet.currency || 'USD';
    if (senderCurrency !== 'USD' && senderCurrency !== currency) {
      return res.status(400).json({ message: `Wallet currency mismatch (wallet: ${senderCurrency}, transfer: ${currency})` });
    }

    const transferAmount = parseFloat(amount);
    if (parseFloat(senderWallet.balance.toString()) < transferAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Execute atomic transfer
    const result = await prismaClient.$transaction(async (tx) => {
      // Decrement sender
      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: transferAmount } }
      });

      // Increment recipient; set currency if recipient wallet is POINTS
      await tx.wallet.update({
        where: { id: recipientWallet.id },
        data: {
          balance: { increment: transferAmount },
          currency: recipientWallet.currency === 'USD' ? currency : recipientWallet.currency
        }
      });

      const senderTx = await tx.transaction.create({
        data: {
          userId: req.user.userId,
          walletId: senderWallet.id,
          type: 'PAYMENT',
          amount: transferAmount,
          currency,
          status: 'COMPLETED',
          paymentMethod: 'INTERNAL',
          description: `Transfer to ${recipient.publicId || recipient.id}`,
          metadata: { recipientPublicId }
        }
      });

      const recipientTx = await tx.transaction.create({
        data: {
          userId: recipient.id,
          walletId: recipientWallet.id,
          type: 'PAYMENT',
          amount: transferAmount,
          currency,
          status: 'COMPLETED',
          paymentMethod: 'INTERNAL',
          description: `Received from ${req.user.userId}`,
          metadata: { senderUserId: req.user.userId }
        }
      });

      return { senderTx, recipientTx };
    });

    return res.status(201).json({
      message: 'Transfer completed',
      transfer: {
        amount: transferAmount.toString(),
        currency,
        to: recipient.publicId || recipient.id
      },
      transactions: result
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Error processing transfer', error: error.message });
  }
});


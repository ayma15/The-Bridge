const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { requireAuth, requireAdmin, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// This file will contain payment gateway integrations
// For now, it's a placeholder structure

// Process deposit callback (webhook handler)
router.post('/webhooks/:gateway', async (req, res) => {
  try {
    const { gateway } = req.params;
    const payload = req.body;

    // Handle different payment gateway webhooks
    // PayPal, Payeer, Chappa, SantimPay, etc.

    res.json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Error processing webhook', error: error.message });
  }
});

// Admin: Process withdrawal
router.post('/withdrawals/:transactionId/process', requireAuth, requirePermission(PERMISSIONS.APPROVE_WITHDRAWALS), async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, paymentId } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
        wallet: true
      }
    });

    if (!transaction || transaction.type !== 'WITHDRAWAL') {
      return res.status(404).json({ message: 'Withdrawal transaction not found' });
    }

    if (status === 'COMPLETED') {
      // Update transaction
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          paymentId
        }
      });
    } else if (status === 'FAILED') {
      // Refund to wallet
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED'
        }
      });

      await prisma.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: {
            increment: transaction.amount
          }
        }
      });
    }

    res.json({
      message: 'Withdrawal processed',
      transaction
    });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ message: 'Error processing withdrawal', error: error.message });
  }
});

module.exports = router;


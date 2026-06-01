const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

// Lookup a user by publicId
router.get('/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    if (!publicId || typeof publicId !== 'string') {
      return res.status(400).json({ message: 'publicId is required' });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { publicId },
        select: {
          id: true,
          publicId: true,
          username: true,
          email: true,
          isActive: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (e) {
      return res.status(501).json({ message: 'Public ID lookup is unavailable until database migration is applied.' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Lookup by publicId error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

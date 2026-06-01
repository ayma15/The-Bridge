const { authenticate } = require('../utils/jwt');
const prisma = require('../config/database');
const { hasPermission } = require('../utils/permissions');

/**
 * Middleware to check if user is authenticated
 */
const requireAuth = authenticate;

/**
 * Middleware to check if user has full admin role
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || user.role !== 'FULL_ADMIN') {
      return res.status(403).json({ message: 'Full admin access required' });
    }

    req.user.role = user.role;
    req.user.limitedPermissions = user.limitedPermissions;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking admin status' });
  }
};

/**
 * Middleware to check if user has moderator or admin role
 */
const requireModerator = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || (user.role !== 'FULL_ADMIN' && user.role !== 'LIMITED_ADMIN')) {
      return res.status(403).json({ message: 'Moderator access required' });
    }

    req.user.role = user.role;
    req.user.limitedPermissions = user.limitedPermissions;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking moderator status' });
  }
};

/**
 * Middleware to check if user has a specific permission (limited admin) or is full admin
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user.role = user.role;
      req.user.limitedPermissions = user.limitedPermissions;

      if (user.role === 'FULL_ADMIN') {
        return next();
      }

      if (user.role === 'LIMITED_ADMIN' && hasPermission(user, permission)) {
        return next();
      }

      return res.status(403).json({ message: 'Permission denied' });
    } catch (error) {
      return res.status(500).json({ message: 'Error checking permission' });
    }
  };
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireModerator,
  requirePermission
};


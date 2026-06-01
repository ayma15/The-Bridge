const PERMISSIONS = {
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_VENDORS: 'MANAGE_VENDORS',
  MANAGE_PRODUCTS: 'MANAGE_PRODUCTS',
  MANAGE_ORDERS: 'MANAGE_ORDERS',
  APPROVE_WITHDRAWALS: 'APPROVE_WITHDRAWALS',
  VIEW_REPORTS: 'VIEW_REPORTS',
  MANAGE_ADS: 'MANAGE_ADS',
  MANAGE_P2P: 'MANAGE_P2P',
  MANAGE_SMM_ORDERS: 'MANAGE_SMM_ORDERS',
  MANAGE_SUPPORT: 'MANAGE_SUPPORT',
}

function hasPermission(user, permission) {
  if (!user) return false
  // Full admins bypass permission checks
  if (user.role === 'FULL_ADMIN') return true
  if (user.role !== 'LIMITED_ADMIN') return false

  try {
    const perms = JSON.parse(user.limitedPermissions || '[]')
    return Array.isArray(perms) && perms.includes(permission)
  } catch (e) {
    return false
  }
}

module.exports = {
  PERMISSIONS,
  hasPermission,
}


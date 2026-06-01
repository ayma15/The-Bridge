function sanitizeBase(username) {
  if (!username || typeof username !== 'string') return 'user';
  return username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'user';
}

function generatePublicId(username) {
  const base = sanitizeBase(username);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
}

module.exports = {
  generatePublicId,
};

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to generate a URL-friendly public identifier
export const generatePublicId = (username: string | null, fallbackId: string) => {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const base = username ? username.toLowerCase().replace(/[^a-z0-9]/g, '') : 'user';
  return `${base}-${randomSuffix}`;
};

export const findUserByPublicId = async (publicId: string) => {
  if (!publicId) return null;

  return prisma.user.findUnique({
    where: { publicId },
    select: {
      id: true,
      publicId: true,
      username: true,
      email: true,
      isActive: true,
      role: true,
    },
  });
};

export const ensurePublicId = async (userId: string) => {
  // Fetch current user data including username to build a deterministic publicId if needed
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, publicId: true },
  });

  if (!user) throw new Error('User not found');

  if (user.publicId && user.publicId.length > 0) {
    return user.publicId;
  }

  const newPublicId = generatePublicId(user.username, user.id);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { publicId: newPublicId },
    select: { publicId: true },
  });
  return updated.publicId;
};

// Function to get or create a public ID for a user
export const getOrCreatePublicId = async (userId: string) => {
  return ensurePublicId(userId);
};

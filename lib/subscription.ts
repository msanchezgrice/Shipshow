import { prisma } from "./prisma";

export async function ensureUser(user: { id: string; firstName?: string | null; lastName?: string | null; imageUrl?: string | null; }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (existing) return existing;
  // create a placeholder until handle is set
  return prisma.user.create({
    data: {
      id: user.id,
      handle: `user-${user.id.slice(0, 8)}`,
      name: fullName || undefined,
      avatarUrl: user.imageUrl || undefined,
      subscription: { create: { status: "free" } }
    },
  });
}

export async function getSubscriptionStatus(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return sub?.status ?? "free";
}

export async function isPaid(userId: string) {
  const status = await getSubscriptionStatus(userId);
  return status === "active";
}

export const MAX_FREE_PROJECTS = 5;

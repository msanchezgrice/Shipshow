import { prisma } from "./prisma";

export async function ensureUser(user: { id: string; firstName?: string | null; lastName?: string | null; imageUrl?: string | null; }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (existing) return existing;
  const created = await prisma.user.create({
    data: {
      id: user.id,
      handle: `user-${user.id.slice(0, 8)}`,
      name: fullName || undefined,
      avatarUrl: user.imageUrl || undefined,
    },
  });
  const subExisting = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (!subExisting) {
    await prisma.subscription.create({ data: { userId: user.id, status: "free" } });
  }
  return created;
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

// Server-side auth facade: uses real Clerk when configured, otherwise falls back to mock

import type { NextRequest } from "next/server";

const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? (process.env.NODE_ENV === "production" ? "0" : "1")) !== "0";
const HAS_CLERK = !!process.env.CLERK_SECRET_KEY;

type AuthResult = { userId: string | null };

export async function auth(_req?: NextRequest): Promise<AuthResult> {
  if (!USE_MOCKS && HAS_CLERK) {
    const real = await (await import("@clerk/nextjs/server")).auth();
    return { userId: real.userId ?? null } as AuthResult;
  }
  return { userId: "dev_user_123" };
}

export async function currentUser(): Promise<{
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
} | null> {
  if (!USE_MOCKS && HAS_CLERK) {
    const real = await (await import("@clerk/nextjs/server")).currentUser();
    // @ts-expect-error: passthrough shape
    return real as any;
  }
  return { id: "dev_user_123", firstName: "Dev", lastName: "User", imageUrl: null };
}



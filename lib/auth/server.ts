// Server-side mock for Clerk's auth/currentUser used in this repo.
// Falls back to real Clerk if NEXT_PUBLIC_USE_MOCKS=0

import type { NextRequest } from "next/server";

const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? (process.env.NODE_ENV === "production" ? "0" : "1")) !== "0";

type AuthResult = { userId: string | null };

export async function auth(_req?: NextRequest): Promise<AuthResult> {
  if (!USE_MOCKS) {
    const real = await (await import("@clerk/nextjs/server")).auth();
    return real as AuthResult;
  }
  // In dev, give a stable fake user when a cookie is present; otherwise null
  // We cannot read cookies easily here without req in all call sites; for simplicity, always return a fixed id.
  // Frontend flows ensure a user record exists; this is sufficient for local UX work.
  return { userId: "dev_user_123" };
}

export async function currentUser(): Promise<{
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
} | null> {
  if (!USE_MOCKS) {
    const real = await (await import("@clerk/nextjs/server")).currentUser();
    // @ts-expect-error - pass-through
    return real;
  }
  return {
    id: "dev_user_123",
    firstName: "Dev",
    lastName: "User",
    imageUrl: null,
  };
}



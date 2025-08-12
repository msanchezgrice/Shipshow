// Server-side mock for Clerk's auth/currentUser used in this repo.
// Falls back to real Clerk if NEXT_PUBLIC_USE_MOCKS=0

import type { NextRequest } from "next/server";

const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "1") !== "0";

type AuthResult = { userId: string | null };

export async function auth(_req?: NextRequest): Promise<AuthResult> {
  return { userId: "dev_user_123" };
}

export async function currentUser(): Promise<{
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
} | null> {
  return {
    id: "dev_user_123",
    firstName: "Dev",
    lastName: "User",
    imageUrl: null,
  };
}



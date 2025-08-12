import { PrismaClient } from "@prisma/client";

// Use mock DB if explicitly requested, or if using mock mode AND no DATABASE_URL is configured.
const USE_MOCK_DB = (
  (process.env.MOCK_DB === "1") ||
  ((process.env.NEXT_PUBLIC_USE_MOCKS === "1" || (process.env.NEXT_PUBLIC_USE_MOCKS === undefined && process.env.NODE_ENV !== "production")) && !process.env.DATABASE_URL)
) ? true : false;

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaImpl: any;
if (USE_MOCK_DB) {
  const { mockPrisma } = require("./mockDb");
  prismaImpl = mockPrisma;
} else {
  prismaImpl =
    global.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
}

export const prisma = prismaImpl as PrismaClient & any;

if (process.env.NODE_ENV !== "production" && !USE_MOCK_DB) global.prisma = prisma;

import { PrismaClient } from "@prisma/client";

const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? (process.env.NODE_ENV === "production" ? "0" : "1")) !== "0";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaImpl: any;
if (USE_MOCKS) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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

if (process.env.NODE_ENV !== "production" && !USE_MOCKS) global.prisma = prisma;

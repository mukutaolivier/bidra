import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Export Prisma client and types
export * from "@prisma/client";

// Export repositories
export * from "./repositories";

// Export exceptions
export * from "./exceptions";

// Export types
export * from "./types/repository.types";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Singleton PrismaClient : en développement, l'instance est conservée sur
 * globalThis pour éviter d'ouvrir une nouvelle connexion à chaque
 * rechargement à chaud de Next.js.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

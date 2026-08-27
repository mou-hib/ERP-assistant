import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Adaptateur Turso (libSQL hébergé). Depuis @prisma/adapter-libsql v6.6,
// l'adaptateur reçoit directement la configuration libSQL (API « factory »)
// au lieu d'une instance de client.
const adapter = new PrismaLibSQL({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Singleton PrismaClient connecté à Turso : en développement, l'instance est
 * conservée sur globalThis pour éviter d'ouvrir une nouvelle connexion à
 * chaque rechargement à chaud de Next.js.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

import { PrismaClient } from "@prisma/client";

// Evita criar múltiplas instâncias do PrismaClient durante hot-reload
// em desenvolvimento (padrão recomendado pela própria documentação do Next.js).
// Prisma 7: url saiu do schema.prisma e vai pro prisma.config.ts;
// o PrismaClient em runtime ainda lê DATABASE_URL do ambiente automaticamente.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Evita criar múltiplas instâncias do PrismaClient durante hot-reload
// em desenvolvimento (padrão recomendado pela própria documentação do Next.js).
// Prisma 7: o engine padrão ("client") não traz mais o binário Rust — exige
// um driver adapter explícito (aqui, node-postgres) em vez de ler
// DATABASE_URL sozinho.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');

-- AlterTable
ALTER TABLE "vendas" ADD COLUMN     "pagoEm" TIMESTAMP(3),
ADD COLUMN     "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE';

-- CreateIndex
CREATE INDEX "vendas_oficinaId_status_idx" ON "vendas"("oficinaId", "status");

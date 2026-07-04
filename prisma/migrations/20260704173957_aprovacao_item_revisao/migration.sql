-- CreateEnum
CREATE TYPE "StatusItemRevisao" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO');

-- AlterTable
ALTER TABLE "itens_revisao" ADD COLUMN     "decididoEm" TIMESTAMP(3),
ADD COLUMN     "status" "StatusItemRevisao" NOT NULL DEFAULT 'PENDENTE';

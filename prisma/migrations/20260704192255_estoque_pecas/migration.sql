-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "codigo" TEXT,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "estoqueMinimo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unidade" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "produtos_oficinaId_codigo_key" ON "produtos"("oficinaId", "codigo");

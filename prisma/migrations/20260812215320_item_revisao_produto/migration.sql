-- AlterTable
ALTER TABLE "itens_revisao" ADD COLUMN     "produtoId" TEXT;

-- CreateIndex
CREATE INDEX "itens_revisao_produtoId_idx" ON "itens_revisao"("produtoId");

-- AddForeignKey
ALTER TABLE "itens_revisao" ADD CONSTRAINT "itens_revisao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

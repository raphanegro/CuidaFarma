-- CreateTable
CREATE TABLE "configuracoes_ia" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "provedorPadrao" TEXT NOT NULL DEFAULT 'anthropic',
    "modeloPadrao" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "groqApiKey" TEXT,
    "geminiApiKey" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_ia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_ia_usuarioId_key" ON "configuracoes_ia"("usuarioId");

-- AddForeignKey
ALTER TABLE "configuracoes_ia" ADD CONSTRAINT "configuracoes_ia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

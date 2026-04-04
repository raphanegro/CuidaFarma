-- CreateEnum
CREATE TYPE "NivelRisco" AS ENUM ('BAIXO', 'MODERADO', 'ALTO');

-- CreateEnum
CREATE TYPE "StatusAdesaoEvolucao" AS ENUM ('BOA', 'REGULAR', 'BAIXA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InterventionType" ADD VALUE 'PATIENT_ORIENTATION';
ALTER TYPE "InterventionType" ADD VALUE 'DOSE_SIMPLIFICATION';
ALTER TYPE "InterventionType" ADD VALUE 'MEDICATION_RECONCILIATION';
ALTER TYPE "InterventionType" ADD VALUE 'REFERRAL';
ALTER TYPE "InterventionType" ADD VALUE 'MEDICATION_DISCONTINUATION';
ALTER TYPE "InterventionType" ADD VALUE 'OTHER';

-- DropForeignKey
ALTER TABLE "intervencoes" DROP CONSTRAINT "intervencoes_analiseId_fkey";

-- AlterTable
ALTER TABLE "intervencoes" ADD COLUMN     "prmId" TEXT,
ADD COLUMN     "resultadoEsperado" TEXT,
ALTER COLUMN "analiseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "calendarios_posologicos" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "atendimentoId" TEXT,
    "itens" JSONB NOT NULL,
    "observacoes" TEXT,
    "geradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendarios_posologicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estratificacoes_risco" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "nivelRisco" "NivelRisco" NOT NULL,
    "pontuacaoAuto" INTEGER NOT NULL,
    "ajusteManual" BOOLEAN NOT NULL DEFAULT false,
    "justificativa" TEXT,
    "calculadoPor" TEXT NOT NULL,
    "calculadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estratificacoes_risco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_acompanhamento" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "proximoRetorno" TIMESTAMP(3),
    "tipoAtendimentoProgramado" TEXT,
    "monitoramentos" JSONB,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_acompanhamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolucoes_clinicas" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "adesao" "StatusAdesaoEvolucao",
    "adesaoObs" TEXT,
    "evolucaoTexto" TEXT,
    "resolucaoPrms" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evolucoes_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evolucoes_clinicas_atendimentoId_key" ON "evolucoes_clinicas"("atendimentoId");

-- AddForeignKey
ALTER TABLE "intervencoes" ADD CONSTRAINT "intervencoes_analiseId_fkey" FOREIGN KEY ("analiseId") REFERENCES "analises_farmaco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervencoes" ADD CONSTRAINT "intervencoes_prmId_fkey" FOREIGN KEY ("prmId") REFERENCES "problemas_medicamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendarios_posologicos" ADD CONSTRAINT "calendarios_posologicos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estratificacoes_risco" ADD CONSTRAINT "estratificacoes_risco_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_acompanhamento" ADD CONSTRAINT "planos_acompanhamento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolucoes_clinicas" ADD CONSTRAINT "evolucoes_clinicas_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolucoes_clinicas" ADD CONSTRAINT "evolucoes_clinicas_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

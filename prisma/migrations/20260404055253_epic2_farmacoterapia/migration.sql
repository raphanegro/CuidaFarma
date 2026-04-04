-- CreateEnum
CREATE TYPE "TipoExame" AS ENUM ('GLICEMIA_JEJUM', 'HEMOGLOBINA_GLICADA', 'COLESTEROL_TOTAL', 'LDL', 'HDL', 'TRIGLICERIDEOS', 'CREATININA', 'TFG', 'OUTRO');

-- CreateEnum
CREATE TYPE "OrigemMedicamento" AS ENUM ('PRESCRICAO_MEDICA', 'AUTOMEDICACAO', 'FITOTERAPICO', 'SUPLEMENTO');

-- CreateEnum
CREATE TYPE "StatusMedicamento" AS ENUM ('EM_USO', 'DESCONTINUADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "CategoriaProblema" AS ENUM ('NECESSIDADE', 'EFETIVIDADE', 'SEGURANCA', 'ADESAO');

-- CreateEnum
CREATE TYPE "GravidadeProblema" AS ENUM ('LEVE', 'MODERADO', 'GRAVE');

-- CreateEnum
CREATE TYPE "StatusProblema" AS ENUM ('IDENTIFICADO', 'EM_ACOMPANHAMENTO', 'RESOLVIDO');

-- CreateEnum
CREATE TYPE "ClassificacaoAdesao" AS ENUM ('BOA', 'PARCIAL', 'BAIXA');

-- DropForeignKey
ALTER TABLE "analises_farmaco" DROP CONSTRAINT "analises_farmaco_medicamentoId_fkey";

-- AlterTable
ALTER TABLE "analises_farmaco" ADD COLUMN     "atendimentoId" TEXT,
ADD COLUMN     "criteriosJson" JSONB,
ALTER COLUMN "medicamentoId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "resultados_exame" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "tipo" "TipoExame" NOT NULL,
    "tipoCustom" TEXT,
    "valor" DECIMAL(10,4) NOT NULL,
    "unidade" TEXT NOT NULL,
    "dataColeta" TIMESTAMP(3) NOT NULL,
    "laboratorio" TEXT,
    "refMin" DECIMAL(10,4),
    "refMax" DECIMAL(10,4),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultados_exame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicamentos_em_uso" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicamentoId" TEXT,
    "nomeCustom" TEXT,
    "dose" TEXT,
    "formaFarmaceutica" TEXT,
    "viaAdministracao" TEXT,
    "frequencia" TEXT,
    "quantidadePorDose" INTEGER NOT NULL DEFAULT 1,
    "horarios" JSONB,
    "indicacao" TEXT,
    "origem" "OrigemMedicamento" NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataTermino" TIMESTAMP(3),
    "status" "StatusMedicamento" NOT NULL DEFAULT 'EM_USO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicamentos_em_uso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problemas_medicamento" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicamentoEmUsoId" TEXT,
    "categoria" "CategoriaProblema" NOT NULL,
    "descricao" TEXT NOT NULL,
    "gravidade" "GravidadeProblema" NOT NULL,
    "status" "StatusProblema" NOT NULL DEFAULT 'IDENTIFICADO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problemas_medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes_adesao" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicamentoEmUsoId" TEXT NOT NULL,
    "qtdEsperada" INTEGER NOT NULL,
    "qtdContada" INTEGER NOT NULL,
    "taxaAdesao" DECIMAL(5,2) NOT NULL,
    "classificacao" "ClassificacaoAdesao" NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avaliacoes_adesao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "analises_farmaco" ADD CONSTRAINT "analises_farmaco_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_exame" ADD CONSTRAINT "resultados_exame_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicamentos_em_uso" ADD CONSTRAINT "medicamentos_em_uso_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicamentos_em_uso" ADD CONSTRAINT "medicamentos_em_uso_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problemas_medicamento" ADD CONSTRAINT "problemas_medicamento_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problemas_medicamento" ADD CONSTRAINT "problemas_medicamento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problemas_medicamento" ADD CONSTRAINT "problemas_medicamento_medicamentoEmUsoId_fkey" FOREIGN KEY ("medicamentoEmUsoId") REFERENCES "medicamentos_em_uso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes_adesao" ADD CONSTRAINT "avaliacoes_adesao_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes_adesao" ADD CONSTRAINT "avaliacoes_adesao_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes_adesao" ADD CONSTRAINT "avaliacoes_adesao_medicamentoEmUsoId_fkey" FOREIGN KEY ("medicamentoEmUsoId") REFERENCES "medicamentos_em_uso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

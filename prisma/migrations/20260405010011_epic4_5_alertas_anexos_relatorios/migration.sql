-- AlterTable
ALTER TABLE "anexos" ADD COLUMN     "descricao" TEXT;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "usuarioId" TEXT,
ADD COLUMN     "usuarioNome" TEXT;

-- CreateTable
CREATE TABLE "alertas_clinicos" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidade" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "medicamentosEnvolvidos" TEXT,
    "sugestaoAcao" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ATIVO',
    "justificativaIgnorado" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pacienteId" TEXT NOT NULL,

    CONSTRAINT "alertas_clinicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartas_prescritor" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "template" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cartas_prescritor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas_paciente" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "prazo" TIMESTAMP(3),
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarefas_paciente_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "alertas_clinicos" ADD CONSTRAINT "alertas_clinicos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartas_prescritor" ADD CONSTRAINT "cartas_prescritor_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartas_prescritor" ADD CONSTRAINT "cartas_prescritor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_paciente" ADD CONSTRAINT "tarefas_paciente_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_paciente" ADD CONSTRAINT "tarefas_paciente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

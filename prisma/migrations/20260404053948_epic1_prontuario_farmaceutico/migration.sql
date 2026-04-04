-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PHARMACIST');

-- CreateEnum
CREATE TYPE "InterventionType" AS ENUM ('DOSE_ADJUSTMENT', 'FREQUENCY_CHANGE', 'MEDICATION_SUBSTITUTION', 'INTERACTION_WARNING', 'CONTRAINDICATION', 'THERAPEUTIC_MONITORING', 'ADDITIONAL_THERAPY');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED');

-- CreateEnum
CREATE TYPE "TipoAtendimento" AS ENUM ('CONSULTA_UBS', 'CONSULTORIO_FARMACEUTICO', 'VISITA_DOMICILIAR', 'TELEATENDIMENTO');

-- CreateEnum
CREATE TYPE "MotivoConsulta" AS ENUM ('INICIO_TRATAMENTO', 'REVISAO_MEDICAMENTOS', 'EFEITO_ADVERSO', 'MONITORAMENTO', 'ADESAO', 'RETORNO', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusAtendimento" AS ENUM ('ABERTO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "StatusCondicao" AS ENUM ('ATIVA', 'RESOLVIDA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PHARMACIST',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "ultimoAcesso" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "genero" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "condicoes" TEXT[],
    "alergias" TEXT[],
    "medicacoes" TEXT[],
    "notas" TEXT,
    "telefoneSecundario" TEXT,
    "unidadeSaude" TEXT,
    "profissionalResponsavel" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicamentos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "principioAtivo" TEXT NOT NULL,
    "dosagem" TEXT NOT NULL,
    "forma" TEXT NOT NULL,
    "fabricante" TEXT,
    "codigoATC" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analises_farmaco" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "achados" TEXT[],
    "recomendacoes" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,

    CONSTRAINT "analises_farmaco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervencoes" (
    "id" TEXT NOT NULL,
    "tipo" "InterventionType" NOT NULL,
    "descricao" TEXT NOT NULL,
    "justificativa" TEXT NOT NULL,
    "status" "InterventionStatus" NOT NULL DEFAULT 'PENDING',
    "dataSugestao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataImplementacao" TIMESTAMP(3),
    "resultado" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "analiseId" TEXT NOT NULL,

    CONSTRAINT "intervencoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pacienteId" TEXT NOT NULL,
    "analiseId" TEXT,

    CONSTRAINT "anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "dados" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pacienteId" TEXT NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimentos" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoAtendimento" NOT NULL,
    "enderecoVisita" TEXT,
    "motivoConsulta" "MotivoConsulta"[],
    "motivoDescricao" TEXT,
    "dataAtendimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusAtendimento" NOT NULL DEFAULT 'ABERTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atendimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_clinico" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "doenca" TEXT NOT NULL,
    "cid10" TEXT,
    "dataDiagnostico" TIMESTAMP(3),
    "status" "StatusCondicao" NOT NULL DEFAULT 'ATIVA',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historico_clinico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dados_clinicos" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "peso" DECIMAL(5,2),
    "altura" DECIMAL(5,2),
    "imc" DECIMAL(5,2),
    "classificacaoImc" TEXT,
    "paSistolica" INTEGER,
    "paDiastolica" INTEGER,
    "freqCardiaca" INTEGER,
    "glicemiaCapilar" DECIMAL(6,2),
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dados_clinicos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_cpf_key" ON "pacientes"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "medicamentos_nome_key" ON "medicamentos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "dados_clinicos_atendimentoId_key" ON "dados_clinicos"("atendimentoId");

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_farmaco" ADD CONSTRAINT "analises_farmaco_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_farmaco" ADD CONSTRAINT "analises_farmaco_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervencoes" ADD CONSTRAINT "intervencoes_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervencoes" ADD CONSTRAINT "intervencoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervencoes" ADD CONSTRAINT "intervencoes_analiseId_fkey" FOREIGN KEY ("analiseId") REFERENCES "analises_farmaco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_analiseId_fkey" FOREIGN KEY ("analiseId") REFERENCES "analises_farmaco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_clinico" ADD CONSTRAINT "historico_clinico_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dados_clinicos" ADD CONSTRAINT "dados_clinicos_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

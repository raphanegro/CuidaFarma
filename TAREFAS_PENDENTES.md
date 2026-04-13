# Ajustes e Funcionalidades a Serem Implementadas

## 1. ✅ Foto do Medicamento
**Status:** EM PROGRESSO (Branch: `claude/add-medication-photo-FFAup`)

### Descrição:
Funcionalidade para capturar e armazenar foto da embalagem do medicamento utilizado pelo paciente.

### O que foi implementado:
- Campo `fotografia` adicionado ao modelo `MedicamentoUso`
- API endpoint `/api/medicamentos-foto` para salvar fotos em base64
- Componente `CapturafotoMedicamento` com acesso à câmera
- Página individual de edição de medicamento (`/pacientes/[pacienteId]/medicamentos/[medicamentoId]`)
- Integração na ficha de medicamentos do paciente

### O que falta:
- Testes de funcionamento com câmera real
- Otimização de armazenamento (considerar cloud storage em produção)
- Validação de tamanho de imagem
- Compressão de imagem antes de salvar

### Endpoint:
- `POST /api/medicamentos-foto` - Salva foto do medicamento

---

## 2. ⭕ Como Fazer Análise de PRF (Problema Relacionado a Medicamento)
**Status:** NÃO INICIADO

### Descrição:
Implementar interface e workflow para farmacêuticos realizarem análise de Problemas Relacionados a Medicamentos (PRF) de acordo com as diretrizes da prática farmacêutica.

### Funcionalidades Necessárias:

#### 2.1 Página de Análise de PRF
- Criar página `/pacientes/[id]/atendimento/[atendimentoId]/prm-analise`
- Integrar com modelo `PRM` existente no banco

#### 2.2 Classificação de PRF
- Campo de classificação:
  - **Problema de Segurança (PSM)**
  - **Problema de Efetividade (PEM)**
  - **Problema de Adesão (PAM)**
  - **Problema de Conveniência (PCM)**

#### 2.3 Descrição e Análise
- Campo para descrever o problema identificado
- Campo para indicar se foi resolvido
- Sugestões de intervenção farmacêutica

#### 2.4 Relacionamento com Medicamentos
- Vincular PRF aos medicamentos do paciente
- Análise de interações medicamentosas
- Análise de duplicidade terapêutica

#### 2.5 Integração na Ficha de Atendimento
- Exibir PRF identificados
- Histórico de resoluções
- Estatísticas de PRF por paciente

### Campos no Banco:
```
PRM {
  id: string
  atendimentoId: string
  classificacao: string (PSM, PEM, PAM, PCM)
  descricao: string
  resolvido: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### API Necessária:
- `GET /api/prm?atendimentoId=[id]` - Listar PRF de um atendimento
- `POST /api/prm` - Criar nova análise de PRF
- `PUT /api/prm/[id]` - Atualizar análise de PRF

---

## 3. ⭕ Manuais de Cuidado Farmacêutico
**Status:** NÃO INICIADO

### Descrição:
Sistema para inserir, armazenar e acessar manuais de orientação sobre Cuidado Farmacêutico que podem ser compartilhados com pacientes ou usados como referência pelo farmacêutico.

### Funcionalidades Necessárias:

#### 3.1 Gerenciamento de Manuais
- Criar página `/manuais` - Listagem de manuais disponíveis
- Criar página `/manuais/novo` - Formulário para criar novo manual
- Criar página `/manuais/[id]/editar` - Edição de manual

#### 3.2 Tipos de Manuais
- **Orientações Gerais:** Cuidados com medicamentos, conservação, etc
- **Por Medicamento:** Instruções específicas de cada medicamento
- **Por Condição:** Orientações para doenças específicas (hipertensão, diabetes, etc)
- **Protocolos:** Protocolos de atendimento farmacêutico

#### 3.3 Campos do Manual
- Título
- Descrição
- Tipo de manual
- Conteúdo (rich text / markdown)
- Imagens/ilustrações
- Palavras-chave
- Data de criação/atualização
- Versão
- Ativo/Inativo

#### 3.4 Modelo de Dados
```
Manual {
  id: string
  titulo: string
  descricao: string?
  tipo: string (ORIENTACAO_GERAL, POR_MEDICAMENTO, POR_CONDICAO, PROTOCOLO)
  conteudo: string (markdown ou HTML)
  palavrasChave: string[]
  versao: string
  ativo: boolean
  createdAt: DateTime
  updatedAt: DateTime
  usuarioId: string
  usuario: Usuario
}
```

#### 3.5 Funcionalidades Adicionais
- Busca e filtro por tipo, palavras-chave
- Visualização em PDF
- Impressão de manuais
- Associação de manuais a pacientes (enviar via link)
- Histórico de versões
- Permissões de acesso (admin pode criar/editar)

#### 3.6 Integração com Pacientes
- Link para compartilhar manual com paciente
- Exibição de manuais relevantes na ficha do paciente
- Anexar manual ao atendimento

### API Necessária:
- `GET /api/manuais` - Listar todos os manuais
- `GET /api/manuais/[id]` - Obter detalhes do manual
- `POST /api/manuais` - Criar novo manual
- `PUT /api/manuais/[id]` - Atualizar manual
- `DELETE /api/manuais/[id]` - Deletar manual
- `POST /api/manuais/[id]/compartilhar` - Gerar link de compartilhamento

---

## Resumo de Prioridades:

| Funcionalidade | Status | Prioridade | Esforço |
|---|---|---|---|
| Foto do Medicamento | EM PROGRESSO | 🔴 Alta | Médio |
| Análise de PRF | ⭕ Não Iniciado | 🔴 Alta | Alto |
| Manuais de Cuidado | ⭕ Não Iniciado | 🟡 Média | Alto |

---

## Notas Importantes:

- **Foto do Medicamento:** Considerar implementar cloud storage (AWS S3, Google Cloud Storage) para produção ao invés de base64
- **Análise de PRF:** Seguir as diretrizes de classificação da OPAS/SEFAR
- **Manuais:** Implementar versionamento para manutenção de histórico de alterações

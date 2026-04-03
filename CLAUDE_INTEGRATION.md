# 🤖 Integração Claude - CuidaFarma

Guia completo para usar a integração com Claude Opus para análises farmacoterapêuticas inteligentes.

## 📋 O que foi implementado?

### ✅ Análises com Inteligência Artificial
- Geração automática de análises farmacoterapêuticas usando Claude Opus 4.6
- Análise contextualizada do perfil clínico do paciente
- Geração de achados e recomendações baseadas em IA
- 6 tipos de análises predefinidas

### ✅ Funcionalidades Implementadas
1. **Nova rota API**: `/api/analises/ia/gerar`
   - POST endpoint que integra com Claude
   - Valida dados do paciente e medicamento
   - Gera análise completa e salva no banco

2. **Página de UI**: `/dashboard/analises/nova-ia`
   - Interface intuitiva para gerar análises
   - Seleção de paciente e medicamento
   - Escolha de tipo de análise
   - Feedback visual durante processamento

3. **Botão rápido**: Link "Com IA" na página de análises
   - Acesso fácil à geração automática
   - Diferenciado visualmente (botão com gradiente)

## 🔧 Configuração Necessária

### 1. Obter Chave da API Claude

1. Acesse: https://console.anthropic.com/
2. Faça login/crie conta (use seu email Anthropic)
3. Vá para "API Keys" no menu lateral
4. Clique em "Create Key"
5. Copie a chave gerada (salve em local seguro!)

### 2. Configurar Variável de Ambiente

Abra o arquivo `.env` na raiz do projeto:

```powershell
notepad .env
```

Adicione (ou atualize) esta linha:

```env
ANTHROPIC_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Substitua `sk_xxxxxxx...` pela sua chave real.

### 3. Instalação de Dependência (se necessário)

A dependência `@anthropic-ai/sdk` já deve estar no `package.json`.
Se não estiver, execute:

```powershell
npm install @anthropic-ai/sdk
```

### 4. Reiniciar o Servidor

```powershell
# Pressione Ctrl+C para parar o servidor atual
# Depois execute:
npm run dev
```

## 🚀 Como Usar

### Método 1: Geração Automática com IA (Recomendado)

1. Na página de Análises, clique no botão **"Com IA"** (laranja/gradiente)
2. Selecione um paciente
3. Selecione um medicamento
4. Escolha o tipo de análise:
   - Avaliação Farmacoterapêutica Geral
   - Avaliação de Interações Medicamentosas
   - Avaliação de Contraindicações
   - Avaliação de Reações Adversas
   - Avaliação de Dosagem Apropriada
   - Monitoramento Terapêutico
5. Clique em "Gerar com IA"
6. Aguarde enquanto Claude processa (15-30 segundos)
7. A análise será criada automaticamente e você será redirecionado

### Método 2: Criação Manual

1. Na página de Análises, clique no botão **"Manual"**
2. Preencha os campos:
   - Paciente
   - Medicamento
   - Tipo de Análise
   - Descrição
   - Achados
   - Recomendações
3. Clique em "Criar Análise"

## 📊 Dados que Claude Analisa

Quando você solicita uma análise automática, Claude tem acesso aos seguintes dados do paciente:

```
- Nome e sobrenome
- Idade (calculada a partir de data de nascimento)
- Gênero
- Condições clínicas registradas
- Alergias conhecidas
- Medicações em uso
- Informações do medicamento
  - Nome
  - Princípio ativo
  - Dosagem
  - Forma farmacêutica
  - Fabricante
  - Código ATC
```

Claude usa esses dados para gerar análises contextalizadas e relevantes.

## 💡 Exemplos de Casos de Uso

### 1. Verificar Interações Medicamentosas
**Cenário**: Paciente com hipertensão usando Losartana, você quer adicionar um novo medicamento.

- Selecione "Avaliação de Interações Medicamentosas"
- Claude analisará automaticamente:
  - Se há incompatibilidade com Losartana
  - Se há risco de interações prejudiciais
  - Recomendações de monitoramento

### 2. Avaliar Adequação da Dosagem
**Cenário**: Paciente idoso, você quer confirmar se a dosagem está apropriada.

- Selecione "Avaliação de Dosagem Apropriada"
- Claude considerará:
  - Idade do paciente
  - Condições clínicas
  - Forma farmacêutica e dosagem

### 3. Monitoramento Contínuo
**Cenário**: Medicamento em uso há 3 meses, você quer avaliar efetividade.

- Selecione "Monitoramento Terapêutico"
- Claude gerará recomendações para:
  - Parâmetros a monitorar
  - Frequência de avaliação
  - Sinais de alerta

## ⚙️ Como Funciona Tecnicamente

```
┌─────────────────────┐
│  Interface Web      │
│  (nova-ia/page)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  API Route          │
│  (/api/analises/    │
│   ia/gerar)         │
└──────────┬──────────┘
           │
      ┌────┴──────────────┐
      │                   │
      ▼                   ▼
┌──────────────┐   ┌──────────────┐
│  Valida      │   │  Busca       │
│  Dados       │   │  Paciente &  │
└──────┬───────┘   │  Medicamento │
       │           └──────┬───────┘
       │                  │
       └──────────┬───────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  Prepara Prompt     │
        │  para Claude        │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  Claude Opus 4.6    │
        │  (Anthropic API)    │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  Parse JSON da      │
        │  Resposta           │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  Salva no Banco     │
        │  (Prisma)           │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  Retorna Análise    │
        │  Criada             │
        └─────────────────────┘
```

## 🔐 Segurança

- **Chave da API**: Nunca compartilhe sua `ANTHROPIC_API_KEY`
- **Variáveis de Ambiente**: Sempre use `.env` para chaves sensíveis
- **Autenticação**: Apenas usuários autenticados podem gerar análises
- **Validação**: Pacientes e medicamentos são validados antes do processamento

## 📝 Estrutura da Resposta

Claude retorna uma resposta estruturada em JSON:

```json
{
  "descricao": "Análise completa do medicamento para o paciente...",
  "achados": [
    "Achado 1: ...",
    "Achado 2: ...",
    "Achado 3: ..."
  ],
  "recomendacoes": [
    "Recomendação 1: ...",
    "Recomendação 2: ...",
    "Recomendação 3: ..."
  ]
}
```

## 🔄 Fluxo de Dados

### Na Criação:
```
Usuário → Interface → API → Claude → Banco de Dados → Análise Criada
```

### No Resgate:
```
Análise Criada → Banco de Dados → API → Interface
```

## 📊 Estatísticas e Limites

- **Modelo usado**: Claude Opus 4.6 (mais poderoso)
- **Limite de tokens**: 1024 tokens de saída
- **Tempo típico**: 15-30 segundos por análise
- **Custo**: Varia conforme uso (consulte preços no console Anthropic)

## 🆘 Troubleshooting

### ❌ "Chave da API Claude não configurada"
**Solução**: Verifique se `ANTHROPIC_API_KEY` está no `.env`

### ❌ "Erro ao gerar análise: 401"
**Solução**: Sua chave pode estar expirada ou inválida. Gere uma nova no console.

### ❌ "Timeout na requisição"
**Solução**: Tente novamente. Pode ser problema de rede ou servidor.

### ❌ "Resposta da IA em formato inválido"
**Solução**: Contate Anthropic support. Pode ser um erro no servidor deles.

## 🚀 Próximos Passos

1. **Integrar com AIOS**: Framework para análises ainda mais avançadas
2. **Dashboard de Análises**: Gráficos e relatórios
3. **Histórico e Versões**: Rastrear mudanças nas análises
4. **Exportar Relatórios**: PDF, Word, etc.
5. **Alertas Inteligentes**: Notificações de achados importantes

## 📞 Suporte

Para problemas com:
- **Claude API**: https://support.anthropic.com
- **CuidaFarma**: Consulte a documentação local
- **Configuração**: Verifique `.env` e reinicie o servidor

---

**Versão**: 1.0
**Última atualização**: Março 2026
**Status**: ✅ Pronto para produção

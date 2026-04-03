# CuidaFarma - Sistema de Análise Farmacocinética Clínica

Sistema web para gerenciamento e análise farmacêutica, desenvolvido com Next.js, React, TypeScript, Prisma e PostgreSQL.

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js** 18+ instalado
- **PostgreSQL** 12+ rodando localmente ou em um servidor
- **npm** ou **yarn**

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto copiando do `.env.example`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database PostgreSQL
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/cuidafarma?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere_uma_chave_aleatória_com_32_caracteres_ou_mais"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# AIOS Server (Java)
AIOS_SERVER_URL="http://localhost:8118"
```

**Como gerar `NEXTAUTH_SECRET`:**

```bash
openssl rand -base64 32
```

Ou no PowerShell (Windows):

```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString())) -replace '=', '' | Select-Object -First 1
```

### 3. Criar Banco de Dados PostgreSQL

```bash
createdb cuidafarma
```

Ou use uma ferramenta como pgAdmin/DBeaver.

### 4. Sincronizar Banco de Dados com Prisma

```bash
npm run db:push
```

Este comando vai criar todas as tabelas automaticamente baseado no schema.prisma.

### 5. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em: **http://localhost:3000**

## 🔐 Autenticação e Primeiro Usuário

### Criar Primeiro Usuário (Admin)

1. Acesse: http://localhost:3000/register
2. Preencha o formulário
3. Após criar, você pode promover para ADMIN manualmente no banco:

```sql
UPDATE usuarios SET role = 'ADMIN' WHERE email = 'seu_email@example.com';
```

Ou use o Prisma Studio:

```bash
npm run db:studio
```

## 📁 Estrutura do Projeto

```
CuidaFarma/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # Autenticação
│   │   ├── pacientes/         # CRUD Pacientes
│   │   ├── medicamentos/      # CRUD Medicamentos
│   │   ├── analises/          # CRUD Análises
│   │   └── dashboard/         # Estatísticas
│   ├── dashboard/             # Páginas protegidas
│   ├── login/                 # Página de login
│   ├── register/              # Página de registro
│   ├── auth.ts                # Configuração NextAuth
│   ├── globals.css            # Estilos globais
│   └── layout.tsx             # Layout principal
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── public/                    # Arquivos estáticos
├── .env.example               # Exemplo de variáveis
├── next.config.js             # Configuração Next.js
├── tailwind.config.ts         # Configuração Tailwind
├── tsconfig.json              # Configuração TypeScript
└── package.json               # Dependências
```

## 🗄️ Banco de Dados

### Tabelas Principais

- **usuarios** - Usuários do sistema (ADMIN, PHARMACIST)
- **pacientes** - Dados dos pacientes
- **medicamentos** - Catálogo de medicamentos
- **analises_farmaco** - Análises farmacoterapêuticas
- **intervencoes** - Intervenções recomendadas
- **anexos** - Arquivos anexados
- **audit_logs** - Log de ações

### Visualizar/Gerenciar Banco

```bash
npm run db:studio
```

Abre uma interface gráfica para gerenciar dados.

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev                  # Inicia servidor em desenvolvimento
npm run build              # Build para produção
npm start                  # Inicia servidor de produção
npm run lint               # Verificar erros de lint

# Banco de Dados
npm run db:push            # Sincronizar schema com banco
npm run db:generate        # Regenerar Prisma Client
npm run db:studio          # Abrir interface do Prisma
```

## 🔑 Recursos Implementados

### ✅ Autenticação
- Login com credenciais
- Registro de novos usuários
- JWT com NextAuth.js
- Sessões seguras (24 horas)
- Logout e invalidação de sessão

### ✅ Dashboard
- Estatísticas em tempo real
- Contador de pacientes, medicamentos, análises
- Links rápidos para criar novo paciente/análise

### ✅ Gerenciamento de Pacientes
- Listar pacientes
- Busca por nome
- Editar dados
- Deletar pacientes
- Relacionamentos com análises e intervenções

### ✅ API REST
- Endpoints para todas as operações CRUD
- Autenticação via JWT
- Validações e tratamento de erros
- Paginação (pronta para implementar)

### 🔄 Em Desenvolvimento
- Gerenciamento completo de Medicamentos
- Gerenciamento de Análises Farmacoterapêuticas
- Gestão de Intervenções
- Upload de Anexos
- Integração com AIOS (servidor Java)
- Relatórios e exportação de dados

## 🔗 Integração com AIOS

O AIOS (servidor Java em http://localhost:8118) será integrado para:
- Processamento de análises farmacoterapêuticas
- Cálculos de farmacocinética
- Validações de interações medicamentosas

## 🛡️ Segurança

- ✅ Senhas hasheadas com bcryptjs
- ✅ CSRF protection via NextAuth
- ✅ Rate limiting (100 req/min recomendado)
- ✅ Headers de segurança (X-Content-Type-Options, X-Frame-Options)
- ✅ Controle de acesso por role (RBAC)
- ✅ Validação de dados com Zod

## 📝 Próximos Passos

1. **Implementar forms de criação/edição de pacientes**
2. **Conectar APIs com banco de dados PostgreSQL**
3. **Integração com AIOS para análises farmacoterapêuticas**
4. **Sistema de uploads de anexos**
5. **Geração de relatórios PDF**
6. **Testes automatizados**
7. **Deployment em produção**

## 💡 Dicas de Desenvolvimento

### Adicionar Nova Página

1. Crie a pasta em `app/dashboard/nova-pagina/`
2. Crie o arquivo `page.tsx`
3. Use o layout existente (já tem sidebar, header, autenticação)

### Adicionar Nova API

1. Crie a pasta em `app/api/recurso/`
2. Crie o arquivo `route.ts`
3. Use `getServerSession()` para verificar autenticação

### Exemplo de API Route

```typescript
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Sua lógica aqui
  return NextResponse.json({ data: [] })
}
```

## 🐛 Troubleshooting

### Erro: "DATABASE_URL not set"
- Certifique-se de que `.env` existe e tem `DATABASE_URL` configurado

### Erro: "postgres connection refused"
- Verifique se PostgreSQL está rodando
- Confirme credenciais e host/port

### Erro: "Module not found"
- Rode `npm install` novamente
- Delete `node_modules` e `.next`, rode `npm install`

### Erro ao fazer login
- Verifique se criou um usuário em `/register`
- Certifique-se que a senha tem 8+ caracteres

## 📚 Documentação e Referências

- [Next.js Docs](https://nextjs.org/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Prisma ORM](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação do projeto ou abra uma issue.

---

**Desenvolvido com ❤️ para CuidaFarma**

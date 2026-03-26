# Guia de Instalação do AIOX no Windows para CuidaFarma

## ✅ Requisitos de Sistema

- **Windows 10** (22H2) ou **Windows 11**
- **RAM**: 4GB mínimo (8GB recomendado)
- **Espaço em disco**: 1GB mínimo (5GB recomendado)
- **Node.js**: 18.x ou superior (20.x LTS recomendado)
- **npm**: 9.x ou superior
- **PowerShell**: 5.1 ou 7.x

## 🚀 Passo a Passo de Instalação

### 1. Instalar Node.js (se ainda não tiver)

Escolha uma das opções:

**Opção A: Windows Package Manager (recomendado)**
```powershell
winget install OpenJS.NodeJS.LTS
```

**Opção B: Chocolatey**
```powershell
choco install nodejs-lts
```

**Opção C: Baixar diretamente**
- Acesse https://nodejs.org/ e baixe a versão LTS

### 2. Verificar instalação do Node.js e npm

```powershell
node --version
npm --version
```

### 3. Instalar AIOX

Execute um dos seguintes comandos (o primeiro é recomendado):

```powershell
npx aiox-core@latest install
```

Ou:

```powershell
npx github:SynkraAI/aiox-core install
```

> **Nota**: O instalador detectará automaticamente se você já possui AIOX instalado e fará upgrade se necessário.

### 4. Verificar instalação do AIOX

```powershell
aiox --version
```

## 🛠️ Configurar Ambiente PowerShell (Opcional, mas recomendado)

Se encontrar erros de execução, pode precisar ajustar a política de execução:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📦 Instalar Dependências do CuidaFarma

Após instalar AIOX, instale as dependências do projeto:

```powershell
npm install
```

## 🔧 Configuração do Banco de Dados

Execute os seguintes comandos para configurar o Prisma:

```powershell
npm run db:generate
npm run db:push
```

## 🚀 Iniciar Desenvolvimento

```powershell
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🐛 Solução de Problemas Comuns

### Erro de Permissão no PowerShell
```powershell
Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser
```

### Limpar cache do npm
```powershell
npm cache clean --force
```

### Reinstalar dependências
```powershell
rm -r node_modules
rm package-lock.json
npm install
```

### Erro ao conectar ao banco de dados
- Verifique a variável de ambiente `DATABASE_URL` no arquivo `.env.local`
- Certifique-se de que o banco de dados está rodando

## 📚 Recursos Úteis

- [Documentação oficial AIOX (Windows)](https://github.com/SynkraAI/aiox-core/blob/main/docs/installation/windows.md)
- [Guia do Usuário AIOX](https://github.com/SynkraAI/aiox-core/blob/main/docs/guides/user-guide.md)
- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Prisma](https://www.prisma.io/docs)

## ✨ Próximos Passos

1. Configure o arquivo `.env.local` com suas variáveis de ambiente
2. Configure o banco de dados (PostgreSQL recomendado)
3. Execute as migrações Prisma
4. Inicie o servidor de desenvolvimento

---
**Última atualização**: 26 de Março de 2026

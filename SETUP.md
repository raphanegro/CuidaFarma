# 🚀 Setup Completo - CuidaFarma

Guia passo a passo para configurar o CuidaFarma no seu computador Windows.

## ✅ Pré-requisitos

### 1. Node.js 18+
- Baixe em: https://nodejs.org/ (versão LTS recomendada)
- Instale seguindo o wizard
- **Verifique a instalação:**
  ```powershell
  node --version
  npm --version
  ```

### 2. PostgreSQL 12+
- Baixe em: https://www.postgresql.org/download/windows/
- Instale com as configurações padrão
- **Importante:** Anote a senha do usuário `postgres` que você criar
- **Verifique a instalação:**
  ```powershell
  psql --version
  ```

### 3. Git (Opcional, mas recomendado)
- Baixe em: https://git-scm.com/download/win

---

## 📋 Passo a Passo

### Passo 1: Abrir PowerShell na Pasta do Projeto

1. Abra File Explorer
2. Navegue para: `C:\Users\Raphaela\Documentos\ProjetosIA\CuidaFarma`
3. Na barra de endereço, digite: `powershell`
4. Pressione `Enter`

**Alternativa:** Abra PowerShell e execute:
```powershell
cd C:\Users\Raphaela\Documentos\ProjetosIA\CuidaFarma
```

### Passo 2: Instalar Dependências

```powershell
npm install
```

Isso vai demorar 2-5 minutos. Aguarde até ver:
```
added XXX packages
```

### Passo 3: Criar Banco de Dados PostgreSQL

Abra outro PowerShell e execute:

```powershell
# Conectar ao PostgreSQL
psql -U postgres
```

Quando pedir senha, digite a que você criou na instalação.

Depois execute (no prompt do PostgreSQL):
```sql
CREATE DATABASE cuidafarma;
\q
```

### Passo 4: Configurar Variáveis de Ambiente

Volte para o PowerShell na pasta do projeto.

1. **Copie o arquivo de exemplo:**
   ```powershell
   copy .env.example .env
   ```

2. **Abra o arquivo `.env` com seu editor favorito:**
   ```powershell
   notepad .env
   ```

   Ou use VS Code:
   ```powershell
   code .env
   ```

3. **Edite as seguintes linhas:**

   ```env
   # Substitua USUARIO e SENHA pelas credenciais do PostgreSQL
   DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/cuidafarma?schema=public"

   # Substitua AQUI_GERE_UMA_CHAVE por uma chave aleatória
   # (use o comando abaixo para gerar)
   NEXTAUTH_SECRET="AQUI_GERE_UMA_CHAVE"
   ```

4. **Gerar NEXTAUTH_SECRET:**

   Execute no PowerShell:
   ```powershell
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
   ```

   Copie o resultado e substitua em `NEXTAUTH_SECRET`.

5. **Exemplo final do arquivo `.env`:**
   ```env
   DATABASE_URL="postgresql://postgres:suaSenha@localhost:5432/cuidafarma?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef1234567890"
   NEXT_PUBLIC_API_URL="http://localhost:3000/api"
   AIOS_SERVER_URL="http://localhost:8118"
   ```

6. **Salve o arquivo** e feche o editor.

### Passo 5: Sincronizar Banco de Dados

No PowerShell (na pasta do projeto), execute:

```powershell
npm run db:push
```

Você verá:
```
✔ Prisma has created your database schema. Done in XXXms
```

Isso criou automaticamente todas as tabelas! 🎉

### Passo 6: Iniciar o Servidor

```powershell
npm run dev
```

Você verá algo como:
```
▲ Next.js 16.0.0
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Passo 7: Acessar a Aplicação

1. Abra seu navegador (Chrome, Firefox, Edge, etc.)
2. Vá para: **http://localhost:3000**
3. Você será redirecionado para o login

### Passo 8: Criar Primeira Conta

1. Clique em "Crie uma agora" (criar conta)
2. Preencha os dados:
   - Nome: `João`
   - Sobrenome: `Silva`
   - Email: `joao@example.com`
   - CPF: `123.456.789-00` (pode ser fake para teste)
   - Senha: `MinhaS3nh@Forte` (mínimo 8 caracteres)

3. Clique em "Criar Conta"
4. Agora faça login com esses dados

### Passo 9: Promover para Admin (Opcional)

Para ter acesso a mais recursos, você pode promover sua conta para ADMIN:

1. Abra outro PowerShell
2. Execute:
   ```powershell
   psql -U postgres -d cuidafarma
   ```

3. Digite (substitua pelo seu email):
   ```sql
   UPDATE usuarios SET role = 'ADMIN' WHERE email = 'joao@example.com';
   \q
   ```

4. Faça logout e login novamente no navegador

---

## 🎉 Tudo Pronto!

Você agora tem:
- ✅ CuidaFarma rodando em http://localhost:3000
- ✅ Banco de dados PostgreSQL sincronizado
- ✅ Autenticação funcionando
- ✅ Dashboard com gerenciamento de pacientes

### Próximos Passos:

1. **Explorar o dashboard**
   - Crie um novo paciente
   - Teste as funcionalidades

2. **Implementar novas features** (conforme necessário)
   - Gerenciamento de medicamentos
   - Análises farmacoterapêuticas
   - Integração com AIOS

3. **Integrar com AIOS**
   - Certifique-se que AIOS está rodando em http://localhost:8118
   - Implemente as API routes para análises

---

## 🆘 Troubleshooting

### ❌ "npm: não é reconhecido como comando"
- Node.js não está instalado ou não está no PATH
- **Solução:** Reinstale Node.js e reinicie o PowerShell

### ❌ "connection refused" (PostgreSQL)
- PostgreSQL não está rodando
- **Solução:** Abra Services (services.msc) e inicie o serviço PostgreSQL

### ❌ "database does not exist"
- Esqueceu de criar a database
- **Solução:** Execute no psql:
  ```sql
  CREATE DATABASE cuidafarma;
  ```

### ❌ "invalid DATABASE_URL"
- Senha ou credenciais incorretas
- **Solução:** Verifique no arquivo `.env` se usuario/senha estão corretos

### ❌ "NEXTAUTH_SECRET not found"
- Esqueceu de gerar a chave
- **Solução:** Rode o comando para gerar e coloque no `.env`

### ❌ "Cannot find module '@/lib/prisma'"
- Esqueceu de rodar `npm install`
- **Solução:** Execute `npm install` novamente

### ❌ Porta 3000 já em uso
- Outra aplicação está usando a porta
- **Solução:**
  ```powershell
  npm run dev -- -p 3001
  ```
  (vai rodar em http://localhost:3001)

---

## 📊 Visualizar Banco de Dados

Para gerenciar dados visualmente:

```powershell
npm run db:studio
```

Abre interface em: http://localhost:5555

---

## 🔄 Desenvolvimento

### Hot Reload
- Toda mudança em arquivos `.tsx` ou `.ts` é atualizada automaticamente

### Reiniciar servidor
- Pressione `Ctrl + C` no PowerShell
- Digite `npm run dev` novamente

### Limpar cache
```powershell
rm -r .next
npm run dev
```

---

## 📚 Documentação Adicional

- Ver arquivo `README.md` para mais informações
- Consultar `prisma/schema.prisma` para estrutura do banco
- Verificar `app/auth.ts` para lógica de autenticação

---

**Parabéns! Você está pronto para usar CuidaFarma! 🚀**

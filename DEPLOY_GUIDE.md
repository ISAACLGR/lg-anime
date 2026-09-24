# Guia de Deploy: Local → Vercel

## Opção 1: Deploy via Vercel CLI (Recomendado)

### Passo 1: Instalar Vercel CLI
```bash
npm i -g vercel
```

### Passo 2: Login no Vercel
```bash
vercel login
```

### Passo 3: Deploy de Preview
```bash
vercel
```
Isso cria um deploy de preview com URL temporária.

### Passo 4: Deploy de Produção
```bash
vercel --prod
```

### Passo 5: Configurar Variáveis de Ambiente
No painel do Vercel: https://vercel.com/reneduartes-projects/lg-anime/settings/environment-variables
- Use as variáveis do arquivo `VERCEL_ENV_VARS.txt`
- **Importante**: Após o primeiro deploy, atualize `EXPO_PUBLIC_API_URL` com a URL real

---

## Opção 2: Deploy via Dashboard Vercel

### Passo 1: Conectar Repositório
1. Acesse https://vercel.com/reneduartes-projects/lg-anime
2. Clique em "Add New Project"
3. Conecte seu repositório (GitHub/Bitbucket/GitLab)

### Passo 2: Configurar Build
- **Framework Preset**: Other
- **Build Command**: `pnpm run build:all`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

### Passo 3: Configurar Variáveis de Ambiente
- Copie as variáveis de `VERCEL_ENV_VARS.txt`
- Cole no painel de Environment Variables

### Passo 4: Deploy
- Clique em "Deploy"
- O Vercel fará build automático

---

## Testar Localmente Antes do Deploy

### Testar Backend
```bash
pnpm run build
pnpm start
```
Acesse: http://localhost:3000/api/health

### Testar Frontend Web
```bash
pnpm run build:web
```
Arquivos estarão em `dist/`

### Testar Completo
```bash
pnpm run build:all
```

---

## Estrutura de Deploy

**Backend:**
- Arquivo: `server/_core/index.ts`
- Build: `dist/api/index.js`
- Rotas: `/api/*`, `/proxy-video`

**Frontend:**
- Arquivos: `app/`, `components/`, etc.
- Build: `dist/` (arquivos estáticos)
- Rotas: `/` (SPA)

---

## Solução de Problemas

**Build falha:**
- Verifique se `pnpm install` funciona localmente
- Verifique se `pnpm run build:all` funciona localmente

**Variáveis de ambiente não funcionam:**
- Verifique se estão configuradas no painel do Vercel
- Verifique se `EXPO_PUBLIC_API_URL` está atualizada

**Backend não responde:**
- Verifique logs no dashboard do Vercel
- Verifique se `DATABASE_URL` está correta

**Frontend não carrega:**
- Verifique se `EXPO_PUBLIC_API_URL` aponta para URL correta
- Verifique se build web gerou arquivos em `dist/`

---

## URLs Após Deploy

**Preview:** `https://lg-anime-abc123.vercel.app`
**Produção:** `https://lg-anime.vercel.app`

Atualize `EXPO_PUBLIC_API_URL` com a URL de produção após o primeiro deploy.

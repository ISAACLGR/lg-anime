# Deploy Manual no Railway

Como não conseguimos conectar via GitHub, aqui estão as opções de deploy manual:

## Opção 1: Deploy via CLI do Railway

### Instalar CLI do Railway

```bash
npm install -g @railway/cli
```

### Login no Railway

```bash
railway login
```

Isso abrirá o navegador para login.

### Criar projeto

```bash
railway init
```

### Configurar variáveis de ambiente

```bash
railway variables set DATABASE_URL="mysql://user:password@localhost:3306/animefire"
railway variables set SCRAPERAPI_KEY="08d973cbf0af4a48f4f5dbb373475b9d"
railway variables set SCRAPERAPI_URL="https://api.scraperapi.com"
railway variables set SCRAPERAPI_DEVICE_TYPE="desktop"
railway variables set SCRAPERAPI_COUNTRY_CODE="br"
railway variables set CACHE_TTL_MS="7200000"
railway variables set IS_LOCAL="false"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
```

### Fazer deploy

```bash
railway up
```

## Opção 2: Upload de arquivos via Dashboard

1. Acesse https://railway.app
2. Faça login
3. Clique em "New Project" → "Empty Project"
4. No projeto criado, clique em "New Service"
5. Selecione "Deploy from Dockerfile"
6. Arraste e solte os arquivos do projeto ou use o upload
7. Configure as variáveis de ambiente no painel

## Opção 3: Usar Render com Bitbucket (Recomendado)

Render aceita Bitbucket nativamente e é mais simples:

1. Acesse https://render.com
2. Faça login com Bitbucket
3. Conecte o repositório `lg-anime`
4. Configure as variáveis de ambiente

Veja `RENDER_DEPLOYMENT.md` para instruções detalhadas.

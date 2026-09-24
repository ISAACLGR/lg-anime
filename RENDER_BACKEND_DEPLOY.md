# Plano de Deploy do Backend no Render/Fly

## Objetivo
Deploy do backend (API Express) no Render ou Fly usando Dockerfile, mantendo servidor persistente para streaming de vídeo e rotas da API.

## Arquitetura Proposta
- **Frontend**: Vercel (arquivos estáticos em `dist/`)
- **Backend**: Render/Fly (servidor Express persistente)
- **Comunicação**: Frontend chama backend via `EXPO_PUBLIC_API_BASE_URL`

## Pré-requisitos
- Conta no Render (render.com) ou Fly.io
- Docker instalado localmente (para testes)
- Repositório conectado ao serviço de deploy (Bitbucket)

---

## Passo 1: Verificar Dockerfile Atual

O Dockerfile atual já está configurado corretamente:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build:all
EXPOSE 3000
CMD ["pnpm", "start"]
```

**Status**: ✅ Dockerfile pronto para uso

---

## Passo 2: Configurar Variáveis de Ambiente no Render

No painel do Render, adicionar as seguintes variáveis de ambiente:

### Variáveis Obrigatórias
- `NODE_ENV` = `production`
- `PORT` = `3000` (Render injeta automaticamente, mas pode definir)
- `IS_LOCAL` = `false`

### Variáveis do ScraperAPI (se usar)
- `SCRAPERAPI_KEY` = `08d973cbf0af4a48f4f5dbb373475b9d`
- `SCRAPERAPI_URL` = `https://api.scraperapi.com`
- `SCRAPERAPI_DEVICE_TYPE` = `desktop`
- `SCRAPERAPI_COUNTRY_CODE` = `br`
- `USE_SCRAPERAPI` = `true` (ou `false` se não usar)

### Variáveis de Cache
- `CACHE_ENABLED` = `true`
- `CACHE_TTL_MS` = `7200000`

### Variáveis de Database (opcional)
- `DATABASE_URL` = sua URL do banco de dados (MySQL/Postgres)

---

## Passo 3: Criar Web Service no Render

### Opção A: Usando o Render Dashboard

1. Acessar [render.com](https://render.com)
2. Clicar em "New +" → "Web Service"
3. Conectar ao repositório Bitbucket: `reneDuarte/lg-anime`
4. Configurar:
   - **Name**: `lg-anime-backend` (ou outro nome)
   - **Region**: escolher região mais próxima (ex: Oregon)
   - **Branch**: `main`
   - **Runtime**: Docker
   - **Root Directory**: deixar vazio (raiz do repo)
   - **Docker Context**: deixar vazio
   - **Dockerfile Path**: `Dockerfile`
5. Adicionar variáveis de ambiente (ver Passo 2)
6. Clicar em "Create Web Service"

### Opção B: Usando render.yaml (Infrastructure as Code)

Criar arquivo `render.yaml` na raiz do projeto:

```yaml
services:
  - type: web
    name: lg-anime-backend
    env: docker
    dockerfilePath: ./Dockerfile
    plan: free # ou starter, standard, etc
    region: oregon
    envVars:
      - key: NODE_ENV
        value: production
      - key: IS_LOCAL
        value: false
      - key: USE_SCRAPERAPI
        value: true
      - key: SCRAPERAPI_KEY
        sync: false # definir manualmente no dashboard
      - key: SCRAPERAPI_URL
        value: https://api.scraperapi.com
      - key: SCRAPERAPI_DEVICE_TYPE
        value: desktop
      - key: SCRAPERAPI_COUNTRY_CODE
        value: br
      - key: CACHE_ENABLED
        value: true
      - key: CACHE_TTL_MS
        value: 7200000
```

---

## Passo 4: Testar Localmente com Docker

Antes de deploy, testar o container localmente:

```powershell
# 1. Build da imagem
docker build -t lg-anime-backend .

# 2. Rodar o container
docker run -p 3000:3000 -e IS_LOCAL=false -e USE_SCRAPERAPI=true lg-anime-backend

# 3. Testar a API
curl http://localhost:3000/api/health
```

---

## Passo 5: Configurar Frontend no Vercel

Após o backend estar rodando no Render:

1. No projeto Vercel, adicionar variável de ambiente:
   - `EXPO_PUBLIC_API_BASE_URL` = `https://lg-anime-backend.onrender.com` (substituir pela URL real)

2. Rebuild do projeto Vercel (push automático ou manual)

---

## Passo 6: Verificação Pós-Deploy

### Testar Backend no Render

```powershell
# Teste de saúde
curl https://lg-anime-backend.onrender.com/api/health

# Teste de rota da API
curl https://lg-anime-backend.onrender.com/api/animefire/em-lancamento/1
```

### Testar Frontend no Vercel

1. Acessar URL do Vercel
2. Navegar entre páginas
3. Testar player de vídeo (streaming via `/proxy-video`)
4. Verificar console do navegador para erros

---

## Passo 7: Monitoramento e Logs

### Logs no Render
- Acessar "Logs" no dashboard do serviço
- Verificar erros de build ou runtime
- Monitorar performance e latência

### Health Check
O backend deve ter um endpoint `/api/health` para health checks automáticos do Render.

---

## Alternativa: Fly.io

Se preferir usar Fly.io em vez de Render:

### Instalar Fly CLI
```powershell
# Windows (via winget)
winget install superfly.flyctl

# Login
flyctl auth login
```

### Deploy no Fly
```powershell
# Inicializar projeto
flyctl launch

# Configurar (responder perguntas)
# - App name: lg-anime-backend
# - Region: escolher região
# - Dockerfile: usar existente

# Deploy
flyctl deploy

# Ver logs
flyctl logs

# Abrir URL
flyctl open
```

### Configurar variáveis de ambiente no Fly
```powershell
flyctl secrets set IS_LOCAL=false
flyctl secrets set USE_SCRAPERAPI=true
flyctl secrets set SCRAPERAPI_KEY=08d973cbf0af4a48f4f5dbb373475b9d
flyctl secrets set SCRAPERAPI_URL=https://api.scraperapi.com
flyctl secrets set SCRAPERAPI_DEVICE_TYPE=desktop
flyctl secrets set SCRAPERAPI_COUNTRY_CODE=br
flyctl secrets set CACHE_ENABLED=true
flyctl secrets set CACHE_TTL_MS=7200000
```

---

## Checklist de Deploy

- [ ] Dockerfile verificado e testado localmente
- [ ] Variáveis de ambiente configuradas no Render/Fly
- [ ] Web service criado no Render/Fly
- [ ] Backend deployado com sucesso
- [ ] Teste `/api/health` passou
- [ ] Teste de rotas da API passou
- [ ] `EXPO_PUBLIC_API_BASE_URL` configurado no Vercel
- [ ] Frontend rebuildado no Vercel
- [ ] Teste end-to-end (frontend → backend)
- [ ] Streaming de vídeo funcionando
- [ ] Logs monitorados sem erros críticos

---

## Troubleshooting

### Build falha no Render
- Verificar logs de build no dashboard
- Confirmar que `pnpm` está instalado corretamente no Dockerfile
- Verificar se todas as dependências estão no `package.json`

### Backend não responde
- Verificar se a porta está correta (3000)
- Verificar variáveis de ambiente
- Verificar logs de runtime

### Streaming de vídeo falha
- Confirmar que o backend está em servidor persistente (não serverless)
- Verificar logs de erros no endpoint `/proxy-video`
- Testar timeout e limitações do plano gratuito

### Frontend não conecta ao backend
- Verificar `EXPO_PUBLIC_API_BASE_URL` no Vercel
- Verificar CORS no backend
- Verificar se backend está acessível publicamente

---

## Custos Estimados

### Render (Free Tier)
- **Free**: 750 horas/mês, sleep após 15min inatividade
- **Starter ($7/mês)**: Sem sleep, mais recursos
- **Standard ($25/mês)**: Performance melhor, mais recursos

### Fly.io (Free Tier)
- **Free**: 3 VMs pequenas, 160GB outbound
- **Paga**: $5-34/mês dependendo dos recursos

---

## Próximos Passos

1. Escolher entre Render ou Fly.io
2. Criar conta e conectar repositório
3. Seguir passos de deploy escolhidos
4. Testar e monitorar
5. Configurar domínio customizado (opcional)<tool_call>read_file<arg_key>file_path</arg_key><arg_value>C:\projetoAnimes\lg-anime\Dockerfile

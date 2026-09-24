# Render Docker Deployment - Acompanhamento

## 📍 Deployment Atual
- **URL:** https://dashboard.render.com/web/srv-daq9cfp7lnhs73c6d060/deploys/dep-daqadbvf3r2c7395oov0
- **Data:** 2026-09-24
- **Tipo:** Docker Build via Render
- **Serviço:** lg-anime-backend

---

## ✅ Checklist de Deploy

- [ ] Dockerfile lido e configurado
- [ ] Build iniciou
- [ ] Dependências instaladas (pnpm install)
- [ ] Código compilado (pnpm run build:all)
- [ ] Container iniciou sem erros
- [ ] Servidor escutando em porta 3000
- [ ] Endpoints retornam respostas (health, API)
- [ ] Deploy concluído com sucesso

---

## 🔍 Monitorar

### Logs Esperados (em ordem):

```
Step 1/15 : FROM node:20-alpine
Step 2/15 : WORKDIR /app
Step 3/15 : RUN npm install -g pnpm
Step 4/15 : COPY pnpm-lock.yaml package.json ./
Step 5/15 : RUN pnpm install --frozen-lockfile
  ↑ Pode demorar 2-5 min

Step 6/15 : COPY . .
Step 7/15 : RUN pnpm run build:all
  ↑ Esperado: esbuild server/_core/index.ts → dist/api/index.js
  ↑ Esperado: expo export → dist/ (web assets)
  ↑ Pode demorar 3-10 min

Step 8/15 : EXPOSE 3000
Step 9/15 : CMD ["pnpm", "start"]

[api] server listening on port 3000
  ✅ SUCESSO - Servidor rodando
```

---

## 🚨 Possíveis Erros e Soluções

### Erro 1: Playwright Proxy (conhecido)
```
net::ERR_PROXY_CONNECTION_FAILED at https://animefire.one
```
**Solução:** Já foi corrigido no código (`playwright-scraper.js`). Se ocorrer novamente, adicione vars ao Render:
```
USE_PLAYWRIGHT=false
USE_SCRAPERAPI=true
SCRAPERAPI_KEY=<sua-chave>
```

### Erro 2: Timeout no pnpm install
```
ERR! The lockfile is outdated...
```
**Solução:** Render tenta redownload. Aguarde ou use `pnpm install --no-frozen-lockfile`

### Erro 3: PORT não especificada
```
Address already in use :::3000
```
**Solução:** Render define PORT=3000 automaticamente. Dockerfile já expõe esta porta.

### Erro 4: Build falha por falta de espaço
```
no space left on device
```
**Solução:** Render tem limite de espaço em plano gratuito. Considere atualizar plano.

---

## 📊 Status Real-Time

**Atualize este arquivo conforme o deploy progride:**

- Data/hora: _____________
- Etapa atual: _____________
- Erros observados: _____________
- Status geral: ⏳ Em progresso / ✅ Sucesso / ❌ Falha

---

## 🔗 Endpoints para Testar (após deploy bem-sucedido)

```bash
# 1. Health check
curl https://lg-anime-backend.onrender.com/api/health

# Resposta esperada:
# {"ok":true,"timestamp":1234567890}

# 2. Scraping test
curl https://lg-anime-backend.onrender.com/api/animefire/em-lancamento/1

# Resposta esperada:
# {"animes":[...], "pagination":{...}}

# 3. Debug endpoints
curl https://lg-anime-backend.onrender.com/api/debug/with-scraper
curl https://lg-anime-backend.onrender.com/api/debug/without-scraper
```

---

## 💾 Variáveis de Ambiente (Render)

Configurado em: Settings → Environment

```
IS_LOCAL=false
USE_PLAYWRIGHT=false
USE_SCRAPERAPI=true
SCRAPERAPI_KEY=<adicione-aqui>
CACHE_ENABLED=false
NODE_ENV=production
PORT=3000
```

---

## 📝 Próximas Ações após Deploy

Se o deploy suceder:
1. ✅ Teste os 3 endpoints acima
2. ✅ Verifique os logs em Render (Logs tab)
3. ✅ Configure `EXPO_PUBLIC_API_BASE_URL` no Vercel (frontend) para apontar a este backend
4. ✅ Redeploy frontend no Vercel
5. ✅ Teste navegação completa (abrir app, clicar em animes, player)

---

## 🆘 Se der erro:

1. Clique em **Logs** no Render Dashboard
2. Procure pela mensagem de erro
3. Copie os últimos 50 linhas de log
4. Compare com a seção "Possíveis Erros" acima
5. Execute a solução correspondente
6. Redeploy

---

## Timestamp do Deploy
- Início: 2026-09-24 04:26:27
- Fim esperado: ~04:35-04:40 (10-15 min de build Docker + start)


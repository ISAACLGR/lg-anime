# Render Deployment - Problema e Solução

## 🔴 PROBLEMA IDENTIFICADO

### Root Cause
O código está tentando usar um proxy Squid local para Playwright, mas no Render este proxy não está funcionando:

```
🎭 Using Playwright for scraping
🔧 Using local Squid proxy for Playwright
net::ERR_PROXY_CONNECTION_FAILED at https://animefire.one/animes/lancamentos?page=1
```

### Por que falha:
1. `USE_PLAYWRIGHT=true` está ativado (usa Playwright em vez de axios)
2. Squid (proxy local) tenta iniciar automaticamente
3. Squid falha ou demora demais para responder
4. Playwright tenta conectar ao proxy que não está pronto
5. Erro: `net::ERR_PROXY_CONNECTION_FAILED`
6. Comando termina com exit code 1

---

## ✅ SOLUÇÕES (em ordem de prioridade)

### Solução 1: DESABILITAR Playwright, usar ScraperAPI (RECOMENDADO)
**Vantagem:** Mais rápido, mais confiável em produção  
**Desvantagem:** Requer créditos de ScraperAPI

**Ação:**
No Render, adicione/atualize variáveis de ambiente:
```
USE_PLAYWRIGHT=false
USE_SCRAPERAPI=true
SCRAPERAPI_KEY=<sua-chave-aqui>
```

Depois redeploy.

### Solução 2: DESABILITAR Playwright, usar axios direto (SEM PROXY)
**Vantagem:** Sem dependência de ScraperAPI  
**Desvantagem:** Pode ser bloqueado por animefire.one (cloudflare, rate limit)

**Ação:**
No Render, adicione:
```
USE_PLAYWRIGHT=false
USE_SCRAPERAPI=false
```

**Code change needed:** Garantir que o código suporta mode "axios only"

### Solução 3: DESABILITAR Squid proxy local, usar Playwright direto
**Vantagem:** Mantém Playwright  
**Desvantagem:** Pode ser bloqueado por Cloudflare

**Ação:**
Localizar no código onde Squid é iniciado e desabilitar.
Ou adicionar variável:
```
SQUID_PROXY_ENABLED=false
```

### Solução 4: Configurar Squid corretamente no Render
**Vantagem:** Mais controle  
**Desvantagem:** Complexo, requer Squid setup

**Não recomendado para Render** — serverless não é ideal para proxy persistente.

---

## 🔍 ANÁLISE DETALHADA DOS LOGS

```
2026-09-24T04:28:53.557238729Z ==> Available at your primary URL https://lg-anime-backend.onrender.com
✅ Serviço iniciou corretamente, domain registrado

[api] server listening on port 3000
✅ Express server ligado

🔍 Scraping config: USE_PLAYWRIGHT=true, USE_SCRAPERAPI=false, hasScraperKey=true
⚠️ Usando Playwright, mas ScraperAPI está DESABILITADO (mesmo tendo chave)

🎭 Using Playwright for scraping
🔧 Using local Squid proxy for Playwright
⚠️ Tentando usar proxy local...

[Playwright] Error fetching animes list: page.goto: net::ERR_PROXY_CONNECTION_FAILED
🔴 FALHA - Proxy não responde

ELIFECYCLE  Command failed with exit code 1
🔴 Serviço terminou por erro
```

---

## 🛠️ IMPLEMENTAÇÃO IMEDIATA

### PASSO 1: Identifique onde essas flags são lidas

No código (provável em `server/_core/index.ts` ou arquivo de config):

```bash
# Procure por:
grep -r "USE_PLAYWRIGHT" server/
grep -r "USE_SCRAPERAPI" server/
grep -r "SQUID" server/
grep -r "Squid proxy" server/
```

### PASSO 2: Localize o código de Playwright/Scraper

Procure arquivos que contêm:
- `PlaywrightScraper`
- `fetchPage`
- `proxy`
- `squid`

### PASSO 3: Encontre onde Squid é iniciado

Busque por comandos como:
```bash
grep -r "squid" server/ --include="*.ts" --include="*.js"
grep -r "child_process" server/ --include="*.ts" --include="*.js"
```

### PASSO 4: Corrija a lógica de proxy

**Option A - Desabilitar Squid totalmente:**
```typescript
// Antes
const useSquidProxy = true;

// Depois
const useSquidProxy = process.env.SQUID_PROXY_ENABLED === 'true' && process.env.IS_LOCAL === 'true';
```

**Option B - Usar ScraperAPI se disponível:**
```typescript
// Antes
const useSquidProxy = true;

// Depois
const useSquidProxy = process.env.USE_SCRAPERAPI !== 'true';
```

### PASSO 5: Atualize env vars no Render

No Render Dashboard:
1. Vá para `Settings` → `Environment`
2. Adicione/Atualize:
   ```
   USE_PLAYWRIGHT=false
   USE_SCRAPERAPI=true
   CACHE_ENABLED=false
   IS_LOCAL=false
   ```
3. Clique "Deploy latest commit"

---

## 📋 COMANDOS PARA TESTAR LOCALMENTE

```powershell
# 1. Build com env vars simulando Render
$env:USE_PLAYWRIGHT = "false"
$env:USE_SCRAPERAPI = "true"
$env:CACHE_ENABLED = "false"
$env:IS_LOCAL = "false"

pnpm run build:all

# 2. Iniciar servidor
node dist/api/index.js

# 3. Em outro terminal, testar health
curl http://localhost:3000/api/health

# 4. Testar scraping com ScraperAPI
curl http://localhost:3000/api/animefire/em-lancamento/1
```

---

## 🎯 RECOMENDAÇÃO FINAL

**Para produção no Render, use esta configuração:**

```env
# Render Environment Variables
IS_LOCAL=false
USE_PLAYWRIGHT=false          # Desabilitar (requer Squid que não funciona em serverless)
USE_SCRAPERAPI=true           # Habilitar (mais confiável em nuvem)
CACHE_ENABLED=false           # Desabilitar (fs não persiste em Render)
NODE_ENV=production           # Automático no Render
PORT=3000                     # Default
```

**Se você NÃO tiver ScraperAPI:**
```env
IS_LOCAL=false
USE_PLAYWRIGHT=false
USE_SCRAPERAPI=false
CACHE_ENABLED=false
```
(Neste caso, axios tentará conectar direto — pode funcionar ou ser bloqueado por Cloudflare)

---

## 📍 ARQUIVOS PARA REVISAR/MODIFICAR

Execute estas buscas para encontrar o código:

```powershell
cd C:\projetoAnimes\lg-anime

# Buscar Playwright
grep -r "UsePlaywright\|USE_PLAYWRIGHT\|PlaywrightScraper" --include="*.ts" --include="*.js"

# Buscar Squid
grep -r "squid\|Squid\|proxy" --include="*.ts" --include="*.js" | grep -i "local\|spawn"

# Buscar ScraperAPI
grep -r "SCRAPERAPI\|scraperapi" --include="*.ts" --include="*.js"
```

---

## ✅ PRÓXIMOS PASSOS

1. **Executar buscas acima** → identifique os arquivos
2. **Ler o arquivo de scraping** → entenda a lógica
3. **Modificar** para desabilitar Squid em produção
4. **Testar localmente** com NODE_ENV=production
5. **Push para git**
6. **Redeploy no Render**
7. **Monitorar logs** para confirmar que agora funciona

---

## 🔗 REFERÊNCIAS

- Render docs: https://render.com/docs/
- Playwright proxy issues: https://github.com/microsoft/playwright/issues
- Squid proxy: http://www.squid-cache.org/

Se precisar de ajuda para encontrar/editar os arquivos específicos, me diga e faço a busca automática.


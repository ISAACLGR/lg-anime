# Instruções para Configurar Environment Variables no Render

## Passo 1: Abra o Dashboard do Render
https://dashboard.render.com/web/srv-daq9cfp7lnhs73c6d060

## Passo 2: Clique em "Settings"
No topo da página, clique na aba **Settings**

## Passo 3: Vá para "Environment"
Na lateral esquerda, clique em **Environment**

## Passo 4: Adicione/Atualize as variáveis abaixo

### Opção A: Se você tem ScraperAPI Key (RECOMENDADO)

```
USE_PLAYWRIGHT=false
USE_SCRAPERAPI=true
SCRAPERAPI_KEY=<sua-chave-aqui>
CACHE_ENABLED=false
IS_LOCAL=false
NODE_ENV=production
```

**Encontrar sua chave ScraperAPI:**
1. Abra https://www.scraperapi.com/dashboard
2. Copie seu **API Key**
3. Cole em `SCRAPERAPI_KEY=`

### Opção B: Se você NÃO tem ScraperAPI (sem custo)

```
USE_PLAYWRIGHT=false
USE_SCRAPERAPI=false
CACHE_ENABLED=false
IS_LOCAL=false
NODE_ENV=production
```

*Nota: Pode ser bloqueado por Cloudflare, mas é grátis*

### Opção C: Manter Playwright mas sem proxy (não recomendado)

```
USE_PLAYWRIGHT=true
USE_SCRAPERAPI=false
CACHE_ENABLED=false
IS_LOCAL=false
NODE_ENV=production
USE_PROXY=false
```

---

## Passo 5: Clique "Save"

## Passo 6: Clique "Redeploy Latest Commit"
No topo da página, clique no botão **Redeploy Latest Commit**

## Passo 7: Aguarde o Deploy
Vai levar ~2-3 minutos. Observe os logs para confirmar sucesso.

---

## Teste após deploy

```powershell
# Health (deve funcionar imediatamente)
powershell -Command "Invoke-WebRequest -Uri 'https://lg-anime-backend.onrender.com/api/health' -UseBasicParsing | Select-Object -ExpandProperty Content"

# Animes (deve retornar lista de animes)
powershell -Command "Invoke-WebRequest -Uri 'https://lg-anime-backend.onrender.com/api/animefire/em-lancamento/1' -UseBasicParsing | Select-Object -ExpandProperty Content"
```

Sucesso = JSON com animes ✅


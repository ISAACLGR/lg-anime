# Configurar Render com ScraperAPI - Instruções Rápidas

## 🔑 Chave ScraperAPI Encontrada

```
SCRAPERAPI_KEY=08d973cbf0af4a48f4f5dbb373475b9d
```

---

## ✅ Passo a Passo para Render

### 1. Abra o Dashboard do Render
https://dashboard.render.com/web/srv-daq9cfp7lnhs73c6d060

### 2. Clique em "Settings"
No topo da página → **Settings**

### 3. Clique em "Environment"
Na lateral esquerda → **Environment**

### 4. Clique em "Add Environment Variable"
Ou edite as existentes

### 5. Adicione/Atualize as Variáveis Abaixo

**Copie e cole isto (uma por vez):**

```
Nome: USE_PLAYWRIGHT
Valor: false
```

```
Nome: USE_SCRAPERAPI
Valor: true
```

```
Nome: SCRAPERAPI_KEY
Valor: 08d973cbf0af4a48f4f5dbb373475b9d
```

```
Nome: SCRAPERAPI_URL
Valor: https://api.scraperapi.com
```

```
Nome: SCRAPERAPI_DEVICE_TYPE
Valor: desktop
```

```
Nome: SCRAPERAPI_COUNTRY_CODE
Valor: br
```

```
Nome: RETRY_ATTEMPTS
Valor: 5
```

```
Nome: RETRY_DELAY_MS
Valor: 3000
```

```
Nome: CACHE_ENABLED
Valor: false
```

```
Nome: IS_LOCAL
Valor: false
```

### 6. Clique "Save"

### 7. Clique "Redeploy Latest Commit"
No topo da página → **Redeploy Latest Commit**

### 8. Aguarde 2-3 minutos

---

## 🧪 Teste Após Deploy

Quando terminar, teste:

```powershell
# Test 1: Health (deve retornar ok:true)
powershell -Command "Invoke-WebRequest -Uri 'https://lg-anime-backend.onrender.com/api/health' -UseBasicParsing | Select-Object -ExpandProperty Content"

# Test 2: Animes (deve retornar lista de animes - vai esperar até 15 segundos)
powershell -Command "Invoke-WebRequest -Uri 'https://lg-anime-backend.onrender.com/api/animefire/em-lancamento/1' -UseBasicParsing | Select-Object -ExpandProperty Content"
```

---

## ✨ O Que Vai Acontecer

1. ✅ Render redeploy com as novas variáveis
2. ✅ Servidor inicia e vê `USE_SCRAPERAPI=true`
3. ✅ Primeira requisição vai para ScraperAPI
4. ✅ Se ScraperAPI falhar, retry automático (5x com backoff)
5. ✅ Se tudo falhar, usa cache
6. ✅ Animefires desbloqueia! 🎉

---

## 📊 Esperado nos Logs

Procure por:
```
🔍 Scraping config: USE_PLAYWRIGHT=false, USE_SCRAPERAPI=true, hasScraperKey=true, IS_LOCAL=false
🌐 Using ScraperAPI with premium: https://api.scraperapi.com/?api_key=08d973cbf0...
✅ Fetch result: 20 animes found, pagination: {...}
```

---

## ❓ Se der erro

- **429 (Rate Limit):** Retry vai tentar novamente
- **502 (Bad Gateway):** Retry vai tentar novamente
- **403 (Forbidden):** Tenta ScraperAPI premium (já configurado)

Tudo deve funcionar agora!

---

## 🎯 Resumo

| Antes | Depois |
|-------|--------|
| ❌ USE_PLAYWRIGHT=true | ✅ USE_SCRAPERAPI=true |
| ❌ Proxy local não existe | ✅ ScraperAPI funciona |
| ❌ 502 Bad Gateway | ✅ Animes carregam |

Faça esse setup agora e teste! 🚀


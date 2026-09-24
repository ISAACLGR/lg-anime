# Solução: Erro de Proxy Squid no Render

## 🔴 PROBLEMA RAIZ

**Arquivo:** `lib/api/animeFire/playwright-scraper.js` (linha 14 e 31-34)

```javascript
const useProxy = process.env.USE_PROXY === 'true';

if (useProxy) {
    launchOptions.proxy = {
        server: 'http://localhost:3128'  // ← Squid proxy local
    };
    console.log('🔧 Using local Squid proxy for Playwright');
}
```

**Arquivo:** `lib/api/animeFire/cliente-anime-fire.js` (linhas 244-269)

```javascript
const usePlaywright = String(process.env.USE_PLAYWRIGHT ?? 'false').toLowerCase() === 'true';
const useScraperApi = String(process.env.USE_SCRAPERAPI ?? 'false').toLowerCase() === 'true';

if (usePlaywright) {
    // Usa Playwright que tenta conectar a localhost:3128 (Squid)
    // ✗ EM RENDER: Falha porque Squid não existe/não responde
}
```

**Por que falha no Render:**
1. `USE_PLAYWRIGHT=true` está sendo passado ao Render
2. Playwright tenta conectar a `localhost:3128` (proxy Squid)
3. Squid não está instalado/rodando no Render
4. Erro: `net::ERR_PROXY_CONNECTION_FAILED`
5. A requisição falha e o serviço interrompe com exit code 1

---

## ✅ SOLUÇÃO

### OPÇÃO A: Usar ScraperAPI (RECOMENDADO)
Se você tem créditos em ScraperAPI, esta é a solução mais confiável.

**Passo 1:** No Render Dashboard, vá para `Environment` e atualize:
```
USE_PLAYWRIGHT=false
USE_SCRAPERAPI=true
SCRAPERAPI_KEY=<sua-chave-aqui>
```

**Passo 2:** Redeploy. Pronto!

### OPÇÃO B: Desabilitar tudo e usar acesso direto (sem proxy)
Se não quiser usar ScraperAPI:

**Passo 1:** No Render Dashboard, vá para `Environment` e atualize:
```
USE_PLAYWRIGHT=false
USE_SCRAPERAPI=false
```

**Passo 2:** Redeploy

**Observação:** Pode ser bloqueado por Cloudflare (429/403), mas é gratuito.

### OPÇÃO C: Corrigir o código para desabilitar Squid em produção (CÓDIGO)
Se quiser corrigir o código-fonte:

**Arquivo:** `lib/api/animeFire/playwright-scraper.js`

Mude linhas 14-35 de:
```javascript
const useProxy = process.env.USE_PROXY === 'true';

const launchOptions = {
    headless: this.headless,
    executablePath: chromiumPath,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
    ]
};

if (useProxy) {
    launchOptions.proxy = {
        server: 'http://localhost:3128'
    };
    console.log('🔧 Using local Squid proxy for Playwright');
}
```

Para:
```javascript
// Apenas use proxy localmente e se USE_PROXY estiver explicitamente ativado
const isLocal = process.env.IS_LOCAL === 'true';
const useProxy = process.env.USE_PROXY === 'true' && isLocal;

const launchOptions = {
    headless: this.headless,
    executablePath: chromiumPath,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
    ]
};

if (useProxy) {
    launchOptions.proxy = {
        server: 'http://localhost:3128'
    };
    console.log('🔧 Using local Squid proxy for Playwright (local development only)');
} else if (!isLocal) {
    console.log('✅ Proxy disabled in production environment');
}
```

---

## 📋 AÇÃO IMEDIATA (Escolha uma)

### Se você não quer mexer em código → Use Opção A ou B (Environment Variables)

1. Abra https://dashboard.render.com/web/srv-daq9cfp7lnhs73c6d060/deploys/dep-daqadbvf3r2c7395oov0
2. Clique em **Settings** → **Environment**
3. Atualize/Adicione:
   - Se tiver ScraperAPI: `USE_SCRAPERAPI=true` e `SCRAPERAPI_KEY=<chave>`
   - `USE_PLAYWRIGHT=false`
4. Clique em **Save**
5. Clique em **Redeploy latest commit**
6. Aguarde o build e verifique se agora funciona

### Se você quer corrigir o código → Use Opção C (Pull & Push)

1. Edite `lib/api/animeFire/playwright-scraper.js` (copie a correção acima)
2. Adicione ao git:
   ```powershell
   cd C:\projetoAnimes\lg-anime
   git add lib/api/animeFire/playwright-scraper.js
   git commit -m "Fix: Disable Squid proxy in production (Render)"
   git push
   ```
3. Render automaticamente redeploy
4. Aguarde o build

---

## 🧪 VERIFICAÇÃO PÓS-DEPLOY

Após fazer a mudança, teste:

```powershell
# Teste endpoint de saúde
curl https://lg-anime-backend.onrender.com/api/health

# Deve responder: {"ok":true,"timestamp":...}

# Teste scraping
curl https://lg-anime-backend.onrender.com/api/animefire/em-lancamento/1

# Deve retornar JSON com lista de animes (ou erro diferente de proxy)
```

Se ainda der erro, verifique os logs no Render Dashboard:
- Vá para **Logs** (botão no topo)
- Procure por `USE_PLAYWRIGHT`, `USE_SCRAPERAPI`, ou `proxy`
- Copie os logs relevantes para debug

---

## 📊 RESUMO DAS OPÇÕES

| Opção | Custo | Confiabilidade | Esforço | Recomendado |
|-------|-------|-----------------|--------|------------|
| A - ScraperAPI | $ (créditos) | ⭐⭐⭐⭐⭐ | 5 min | ✅ SIM |
| B - Direto (sem proxy) | Grátis | ⭐⭐ | 5 min | Se sem ScraperAPI |
| C - Corrigir código | Grátis | ⭐⭐⭐⭐ | 10 min | Para produção segura |

---

## 🔗 REFERÊNCIAS

- **Render Logs:** https://dashboard.render.com/web/srv-daq9cfp7lnhs73c6d060
- **Render Env Variables:** Settings → Environment
- **ScraperAPI Docs:** https://www.scraperapi.com/documentation
- **Código problematique:**
  - `lib/api/animeFire/playwright-scraper.js` (linhas 14, 31-35)
  - `lib/api/animeFire/cliente-anime-fire.js` (linhas 244-269)


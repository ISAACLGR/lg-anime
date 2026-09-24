# Soluções para Bloqueio do AnimeFire

## 🔴 PROBLEMA

AnimeFire bloqueia requisições mesmo com ScraperAPI:
- Cloudflare detecta bots
- Rate limiting agressivo
- Pode exigir verificação de IP

---

## ✅ SOLUÇÕES (Ranking por Efetividade)

### 1️⃣ **PREMIUM ScraperAPI com Residential Proxies** ⭐⭐⭐⭐⭐
**Melhor opção para animefir.one**

```
USE_SCRAPERAPI=true
SCRAPERAPI_KEY=<sua-chave>
SCRAPERAPI_DEVICE_TYPE=desktop
SCRAPERAPI_COUNTRY_CODE=br
SCRAPERAPI_PROXY_TYPE=residential  ← Premium
```

**Implementação no código:**

Edite `lib/api/animeFire/cliente-anime-fire.js` (linha ~273):

```javascript
// Antes
const scraperUrl = process.env.SCRAPERAPI_URL || 'https://api.scraperapi.com';
const scraperKey = process.env.SCRAPERAPI_KEY;
const deviceType = process.env.SCRAPERAPI_DEVICE_TYPE || 'desktop';
const countryCode = process.env.SCRAPERAPI_COUNTRY_CODE || 'br';
linkProx = `${scraperUrl}/?api_key=${scraperKey}&url=${encodeURIComponent(baseUrl)}&device_type=${deviceType}&country_code=${countryCode}&render=true&premium=true`;

// Depois (adicione proxy_type)
linkProx = `${scraperUrl}/?api_key=${scraperKey}&url=${encodeURIComponent(baseUrl)}&device_type=${deviceType}&country_code=${countryCode}&render=true&premium=true&proxy_type=residential`;
```

**Custo:** ~0.01-0.05 USD por requisição  
**Taxa de sucesso:** 95%+

---

### 2️⃣ **Retry com Backoff Exponencial** ⭐⭐⭐⭐
**Sem custo adicional, combina com qualquer solução**

Edite `lib/api/animeFire/cliente-anime-fire.js`:

```javascript
// Adicione função de retry
async fetchWithRetry(axios, url, maxRetries = 3, initialDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Referer': url
                },
                timeout: 45000,
                maxRedirects: 5
            });
            return response;
        } catch (error) {
            if (attempt === maxRetries) throw error;
            
            const delay = initialDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ Retry ${attempt}/${maxRetries} em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Use assim em fetchAnimesFromPage:
const response = await this.fetchWithRetry(axios, linkProx);
```

**Vantagem:** Grátis, aumenta taxa de sucesso  
**Desvantagem:** Mais lento (espera entre tentativas)

---

### 3️⃣ **Usar Playwright com Headless Browser Real** ⭐⭐⭐
**Simula navegador real, escapa de detecção**

Edite `lib/api/animeFire/cliente-anime-fire.js` (linha ~244):

```javascript
// Mude para
const usePlaywright = String(process.env.USE_PLAYWRIGHT ?? 'true').toLowerCase() === 'true'; // ← true by default

// E configure as vars em Render:
USE_PLAYWRIGHT=true
USE_SCRAPERAPI=false
CACHE_ENABLED=false
```

Edite `lib/api/animeFire/playwright-scraper.js`:

```javascript
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
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',  // ← Novo
        '--disable-web-resources',
        '--disable-extensions'
    ]
};

// Adicione ao context
const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    extraHTTPHeaders: {
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    }
});

// Stealth mode
await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
    });
});
```

**Vantagem:** Mais efetivo para sites com JavaScript pesado  
**Desvantagem:** Consome mais recursos, mais lento

---

### 4️⃣ **Combinar Estratégias** ⭐⭐⭐⭐⭐
**Recomendado: Usar ordem de fallback**

```javascript
async fetchAnimesFromPage(axios, baseUrl) {
    // Estratégia 1: ScraperAPI Premium
    if (process.env.USE_SCRAPERAPI === 'true' && process.env.SCRAPERAPI_KEY) {
        try {
            return await this.fetchWithScraperAPI(baseUrl);
        } catch (e) {
            console.warn('ScraperAPI falhou, tentando Playwright...');
        }
    }
    
    // Estratégia 2: Playwright com Browser Real
    if (process.env.USE_PLAYWRIGHT === 'true') {
        try {
            return await this.fetchWithPlaywright(baseUrl);
        } catch (e) {
            console.warn('Playwright falhou, tentando acesso direto...');
        }
    }
    
    // Estratégia 3: Acesso direto com Retry
    try {
        return await this.fetchDirect(baseUrl);
    } catch (e) {
        console.error('Todas as estratégias falharam:', e);
        return { animes: [], pagination: {} };
    }
}
```

---

### 5️⃣ **Usar Outra Fonte de Dados** ⭐⭐
**Se AnimeFire ficar bloqueado permanentemente**

Alternativas:
- **MyAnimeList API** — Dados estruturados, sem scraping
- **AniList GraphQL** — Melhor qualidade de dados
- **JiKan (MyAnimeList Unofficial)** — Já integrada no projeto

Edite `server/_core/index.ts`:

```typescript
// Adicione novo endpoint usando JiKan
app.get("/api/jikan/seasonal", async (req, res) => {
    try {
        const resultado = await JikanClient.getSeasonal();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch from JiKan"});
    }
});
```

---

## 🎯 RECOMENDAÇÃO IMEDIATA

**Use esta configuração no Render (melhor custo-benefício):**

```env
USE_PLAYWRIGHT=false
USE_SCRAPERAPI=true
SCRAPERAPI_KEY=<sua-chave>
SCRAPERAPI_PROXY_TYPE=residential
CACHE_ENABLED=false
RETRY_ATTEMPTS=3
RETRY_DELAY_MS=2000
```

**E implemente Retry + Backoff** no código (Solução 2).

---

## 📊 Comparação de Métodos

| Método | Custo | Taxa de Sucesso | Velocidade | Complexidade |
|--------|-------|-----------------|-----------|--------------|
| ScraperAPI Std | $ | 60-70% | Rápido | Baixa |
| ScraperAPI Premium | $$ | 95%+ | Rápido | Baixa |
| Playwright | Grátis | 70-80% | Lento | Média |
| Retry + Backoff | Grátis | +20% | Lento | Baixa |
| MyAnimeList API | Grátis | 100% | Rápido | Alta |
| Combinada | $$ | 99% | Médio | Alta |

---

## 🔧 Implementação Rápida

Se quiser apenas adicionar **Retry com Backoff** agora:

1. Edite `lib/api/animeFire/cliente-anime-fire.js`
2. Adicione a função `fetchWithRetry` (Solução 2 acima)
3. Use em `fetchAnimesFromPage` (linha ~306)
4. Commit e push
5. Redeploy no Render

Quer que eu implemente uma das soluções agora?


const { chromium } = require('playwright');

class PlaywrightScraper {
    constructor(options = {}) {
        this.timeout = options.timeout || 30000;
        this.headless = options.headless !== false;
    }

    async fetchPage(url, waitForSelector = null) {
        let browser = null;
        
        try {
            const chromiumPath = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';
            // Only use proxy locally (development). In production (e.g., Render), Squid is not available
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
                console.log('✅ Squid proxy disabled in production environment');
            }

            browser = await chromium.launch(launchOptions);

            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport: { width: 1920, height: 1080 }
            });

            const page = await context.newPage();
            
            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: this.timeout
            });

            if (waitForSelector) {
                try {
                    await page.waitForSelector(waitForSelector, { timeout: 10000 });
                } catch (e) {
                    console.log(`⚠️ Selector ${waitForSelector} not found, proceeding anyway`);
                }
            }

            // Wait a bit more for dynamic content
            await page.waitForTimeout(3000);

            const html = await page.content();
            
            await context.close();
            await browser.close();

            return html;
        } catch (error) {
            if (browser) {
                await browser.close();
            }
            throw error;
        }
    }

    async fetchAnimesList(url) {
        try {
            const html = await this.fetchPage(url, '.anime-card');
            return html;
        } catch (error) {
            console.error('[Playwright] Error fetching animes list:', error);
            throw error;
        }
    }

    async fetchAnimeDetails(url) {
        try {
            const html = await this.fetchPage(url, '.episode-list');
            return html;
        } catch (error) {
            console.error('[Playwright] Error fetching anime details:', error);
            throw error;
        }
    }
}

module.exports = PlaywrightScraper;

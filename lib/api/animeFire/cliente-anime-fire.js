// Serviço dedicado para filtros de busca de animes
const axios = require("axios");
const ExtractVideo = require('./extract-video');
const extractVideo = new ExtractVideo();
const ListEpsodiosAnimes = require('./list-episodios-animes');
const listEpisodios = new ListEpsodiosAnimes();
const FileCache = process.env.GOOGLE_DRIVE_ENABLED === 'true' ? require('./google-drive-cache') : require('./file-cache');
const BASE_URL = 'https://animefire.one/';

class ClienteAnimeFire {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutos para evitar 429
        this.lastRequestTime = 0;
        this.requestDelay = 10000; // 10 segundos entre requisições (extremamente seguro)
        const { TTL_MS, ENABLED: CACHE_ENABLED } = require('../../../constants/const').CACHE_CONFIG;
        const { ENABLED, CREDENTIALS_PATH, CACHE_FOLDER } = require('../../../constants/const').GOOGLE_DRIVE_CONFIG;
        
        const cacheOptions = { ttlMs: TTL_MS, enabled: CACHE_ENABLED };
        if (ENABLED) {
            this.fileCache = new FileCache({ ...cacheOptions, credentialsPath: CREDENTIALS_PATH, cacheFolder: CACHE_FOLDER });
        } else {
            this.fileCache = new FileCache(cacheOptions);
        }
    }

    getCacheKey(filters) {
        return JSON.stringify(filters);
    }

    // Verificar cache
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    // Salvar no cache
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // Limpar cache expirado
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp >= this.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }
    extractPagination($, baseUrl) {
        const pagination = {
            currentPage: null,
            totalPages: null
        };

        const $pagination = $("ul.pagination");
        if ($pagination.length === 0) {
            return pagination;
        }

        // Extrair página atual
        const currentPage = $pagination.find("a.page-link.text-info").first().text().trim();
        if (currentPage) {
            pagination.currentPage = parseInt(currentPage) || 1;
        }

        // Extrair link "Última" para obter o total de páginas
        const $lastLink = $pagination.find("li.firLasLi a.page-link").last();
        if ($lastLink.length > 0) {
            const lastHref = $lastLink.attr('href');
            if (lastHref) {
                // Extrair número da última página
                const lastPageMatch = lastHref.match(/\/(\d+)$/);
                if (lastPageMatch) {
                    pagination.totalPages = parseInt(lastPageMatch[1]);
                }
            }
        }

        return pagination;
    }

    // Limpar texto
    cleanText(text) {
        if (!text) return '';
        return text.replace(/\s+/g, ' ').trim();
    }

    // Extrair animes do HTML (reutilizado para cache e resposta direta)
    normalizeImageUrl(image, baseUrl) {
        if (!image || typeof image !== 'string') return '';

        const cleaned = image.trim();
        if (!cleaned || cleaned === 'null' || cleaned === 'undefined') return '';
        if (cleaned.startsWith('//')) return `https:${cleaned}`;
        if (/^(https?:|data:|blob:)/i.test(cleaned)) return cleaned;

        try {
            return new URL(cleaned, baseUrl.startsWith('http') ? baseUrl : BASE_URL).toString();
        } catch {
            return cleaned;
        }
    }

    extractAnimesFromHtml($, baseUrl) {
        const animes = [];
        const seen = new Set();

        const pushAnime = (link, image, title, classification, score) => {
            if (!link || !title) return;
            const normalizedLink = new URL(link, baseUrl.startsWith('http') ? baseUrl : BASE_URL).toString();
            const normalizedImage = this.normalizeImageUrl(image, baseUrl);
            if (!normalizedImage) return;
            const key = `${normalizedLink}|${title}`;
            if (seen.has(key)) return;
            seen.add(key);
            animes.push({
                title,
                image: normalizedImage,
                classification,
                score,
                link: normalizedLink,
            });
        };

        const anchorSelector = 'a[href*="/anime/"]';
        const $anchors = $(anchorSelector);
        if ($anchors.length > 0) {
            $anchors.each((i, elem) => {
                const $anchor = $(elem);
                const rawHref = $anchor.attr('href');
                const rawText = this.cleanText($anchor.text());
                if (!rawHref || !rawText || rawText.length < 4) return;

                const image = $anchor.find('img').first().attr('src') || $anchor.find('img').first().attr('data-src') || $anchor.closest('article').find('img').first().attr('src') || $anchor.closest('article').find('img').first().attr('data-src');
                const title = rawText;
                const classification = this.cleanText($anchor.closest('article').find("span[class*='tag'], span[class*='class']").first().text().trim());
                const score = this.cleanText($anchor.closest('article').find("span[class*='score'], span[class*='rating']").first().text().trim());

                pushAnime(rawHref, image, title, classification, score);
            });
        }

        if (animes.length > 0) return animes;

        const selectors = [
            "div.divCardUltimosEps",
            "div.card",
            "div.anime-card",
            "div.item",
            "article.anime",
            "div[class*='card']",
            "div[class*='anime']",
            "a[href*='/animes/']",
            "a[href*='/anime/']",
            "app-anime-card",
            "div[class*='Card']",
            "div[class*='Anime']",
            "a[href*='/animes/'] img",
            "a[href*='/anime/'] img",
            "div[class*='lancamento']",
            "div[class*='episodio']",
        ];

        for (const selector of selectors) {
            const elements = $(selector);
            if (elements.length === 0) continue;

            console.log(`✅ Encontrados ${elements.length} elementos com seletor: ${selector}`);
            elements.each((i, elem) => {
                const $card = $(elem);
                const link = $card.attr('href') || $card.find('a').first().attr('href');
                const image = $card.find('img').first().attr('data-src') || $card.find('img').first().attr('src');
                const title = this.cleanText($card.attr('title') || $card.find('h3').first().text().trim()) ||
                    this.cleanText($card.find('.title').first().text().trim()) ||
                    this.cleanText($card.find('a[title]').first().attr('title') || '');
                const classification = this.cleanText($card.find("span[class*='tag'], span[class*='class']").first().text().trim());
                const score = this.cleanText($card.find("span[class*='score'], span[class*='rating']").first().text().trim());

                pushAnime(link, image, title, classification, score);
            });

            if (animes.length > 0) break;
        }

        return animes;
    }

    async fetchPageWithBrowser(baseUrl) {
        try {
            // Check if playwright is available before requiring it
            let playwright;
            try {
                playwright = require('playwright');
            } catch (e) {
                console.warn('Browser fallback unavailable: Playwright not installed');
                return null;
            }

            const { chromium } = playwright;
            const browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            const page = await browser.newPage({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            });

            await page.goto(baseUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 60000,
            });

            // O AnimeFire agora renderiza a maioria dos cards via JS. O "networkidle"
            // pode demorar demais ou nunca acontecer, então aguardamos o seletor real dos cards.
            await page.waitForSelector('a[href*="/anime/"], app-anime-card', {
                timeout: 20000,
                state: 'visible',
            }).catch(() => undefined);

            await page.waitForTimeout(2000);
            const html = await page.content();
            await browser.close();
            return html;
        } catch (error) {
            console.warn('Browser fallback unavailable:', error.message);
            return null;
        }
    }

    // Buscar animes da página principal
    async fetchAnimesFromPage(axios, baseUrl) {
        try {
            const useScraperApi = String(process.env.USE_SCRAPERAPI ?? 'true').toLowerCase() === 'true';
            const hasScraperKey = !!(process.env.SCRAPERAPI_KEY && String(process.env.SCRAPERAPI_KEY).trim());

            let linkProx = baseUrl;
            if (useScraperApi && hasScraperKey && process.env.IS_LOCAL === 'true') {
                const {URL, KEY, DEVICE_TYPE, COUNTRY_CODE} = require('../../../constants/const').SCRAPERAPI_CONFIG;
                linkProx = `${URL}/?api_key=${KEY}&url=${encodeURIComponent(baseUrl)}&device_type=${DEVICE_TYPE}&country_code=${COUNTRY_CODE}`;
            }
            const cached = await this.fileCache.get(baseUrl);
            if (cached) {
                const cheerio = require('cheerio');
                const $ = cheerio.load(cached.data);
                const pagination = this.extractPagination($, baseUrl);
                const animes = this.extractAnimesFromHtml($, baseUrl);

                if (animes.length > 0) {
                    console.log('✅ Retornando dados do cache SQLite');
                    return { animes, pagination };
                }

                console.log('⚠️ Cache encontrado, mas sem dados válidos. Recarregando página...');
                await this.fileCache.delete(baseUrl);
            }
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': baseUrl
            };
            console.log(useScraperApi && hasScraperKey ? '🌐 Usando ScraperAPI:' : '🌐 Acessando AnimeFire direto:', linkProx);
            const response = await axios.get(linkProx, {
                headers: headers,
                timeout: 45000,
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status >= 200 && status < 500;
                }
            });
            await this.fileCache.set(baseUrl, { data: response.data, url: baseUrl });
            const cheerio = require('cheerio');
            const $ = cheerio.load(response.data);
            const pagination = this.extractPagination($, baseUrl);
            let animes = this.extractAnimesFromHtml($, baseUrl);

            if (animes.length === 0) {
                console.log('🔄 Página sem cards detectados; tentando renderização do navegador para a nova estrutura do AnimeFire');
                const renderedHtml = await this.fetchPageWithBrowser(baseUrl);
                if (renderedHtml) {
                    const $render = cheerio.load(renderedHtml);
                    animes = this.extractAnimesFromHtml($render, baseUrl);
                }
            }

            return {
                animes,
                pagination,
            };
        } catch (error) {
            console.error('Erro ao buscar animes da página:', error.message);
            if (error.response?.status === 403) {
                console.log('🚫 Bloqueio 403 detectado! Tentando estratégia alternativa...');
                try {
                    const fallbackResponse = await axios.get(baseUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                            'Accept-Encoding': 'gzip, deflate',
                            'Connection': 'keep-alive',
                            'Upgrade-Insecure-Requests': '1',
                            'Referer': 'https://www.google.com/'
                        },
                        timeout: 25000
                    });
                    const cheerio = require('cheerio');
                    const $ = cheerio.load(fallbackResponse.data);
                    const pagination = this.extractPagination($, baseUrl);
                    let animes = this.extractAnimesFromHtml($, baseUrl);

                    if (animes.length === 0) {
                        const renderedHtml = await this.fetchPageWithBrowser(baseUrl);
                        if (renderedHtml) {
                            const $render = cheerio.load(renderedHtml);
                            animes = this.extractAnimesFromHtml($render, baseUrl);
                        }
                    }

                    console.log('✅ Estratégia alternativa funcionou!');
                    return { animes, pagination };
                } catch (fallbackError) {
                    console.log('❌ Estratégia alternativa também falhou:', fallbackError.message);
                }
            }
            return {
                animes: [],
                pagination: null
            };
        }
    }

    // Limpar cache (para manutenção)
    async clearCache() {
        this.cache.clear();
        await this.fileCache.clear();
    }

    // Obter estatísticas do cache
    async getCacheStats() {
        this.cleanExpiredCache();
        const scraperStats = await this.fileCache.stats();
        return {
            size: this.cache.size,
            timeout: this.cacheTimeout / 1000, // em segundos
            fileCache: scraperStats
        };
    }

    resolveFilter(query) {
        const {letra, ano, score, classificacao} = query;
        const filters = {};
        if (letra) filters.letra = letra;
        if (ano) filters.ano = ano;
        if (score !== undefined) filters.score = score;
        if (classificacao) filters.classificacao = classificacao;

        if (Object.keys(filters).length > 0) {
            const queryParams = new URLSearchParams();
            if (filters.letra) queryParams.append('letra', filters.letra);
            if (filters.ano) queryParams.append('ano', filters.ano);
            if (filters.score !== undefined) queryParams.append('score', filters.score);
            if (filters.classificacao) queryParams.append('classificacao', filters.classificacao);

            return queryParams.toString();
        }
        return null;
    }

    sanitizeText(value) {
        if (value === null || value === undefined) return '';
        return String(value).replace(/\s+/g, ' ').trim();
    }

    normalizeResultItem(item) {
        if (!item || typeof item !== 'object') return null;

        const rawTitle = this.sanitizeText(item.title ?? item.name ?? item.anime_title ?? item.text ?? item.label);
        const rawLink = this.sanitizeText(item.link ?? item.href ?? item.url ?? item.slug ?? '');
        if (!rawTitle || !rawLink) return null;

        const normalizedLink = rawLink.startsWith('http') ? rawLink : new URL(rawLink, BASE_URL).toString();
        const normalizedImage = this.normalizeImageUrl(item.image ?? item.poster ?? item.cover ?? item.thumb ?? item.img ?? '', BASE_URL);

        return {
            title: rawTitle,
            image: normalizedImage || '',
            classification: this.sanitizeText(item.classification ?? item.classificacao ?? item.genre ?? item.tag ?? ''),
            score: this.sanitizeText(item.score ?? item.rating ?? item.avaliacao ?? item.note ?? ''),
            link: normalizedLink,
        };
    }

    matchesSearchQuery(title, link, query) {
        if (!query) return true;
        const normalizedQuery = String(query).toLowerCase().trim();
        if (!normalizedQuery) return true;

        const titleText = String(title ?? '').toLowerCase();
        const linkText = String(link ?? '').toLowerCase();
        const queryVariants = [
            normalizedQuery,
            normalizedQuery.replace(/-/g, ' '),
            normalizedQuery.replace(/\s+/g, '-'),
        ];

        return queryVariants.some((variant) => titleText.includes(variant) || linkText.includes(variant));
    }

    resolveRouteName(nameServico) {
        const routeMap = {
            // Cada categoria precisa ter uma URL distinta para evitar
            // que o cache e a página da AnimeFire sejam compartilhados
            // entre listagens diferentes. Isso fazia a home repetir o mesmo anime.
            'em-lancamento': 'animes/lancamentos',
            'animes-atualizados': 'animes',
            'lista-de-animes-legendados': 'animes/legendados',
            'lista-de-animes-dublados': 'animes/dublados',
            'pesquisar': 'animes/pesquisar',
        };

        return routeMap[nameServico] || nameServico;
    }

    async resolveLinkAndFilter(nameServico, req, res) {
        try {
            const startedAt = Date.now();
            console.log('[AnimeFire] resolveLinkAndFilter start:', { nameServico, query: req?.query, params: req?.params });

            if (!nameServico) {
                throw new Error('Nome do serviço é obrigatório');
            }

            const routeName = this.resolveRouteName(nameServico);
            let lancamentoUrl;
            const pageNum = req.params?.page || req.query?.page;

            if (nameServico === 'pesquisar') {
                const rawBusca = req.query?.q ?? req.query?.search ?? req.query?.busca ?? req.params?.busca ?? req.params?.query ?? '';
                const busca = String(rawBusca || '').trim();
                if (!busca) {
                    throw new Error('Parâmetro de busca é obrigatório. Use ?q=naruto ou ?search=naruto.');
                }

                const params = new URLSearchParams();
                params.set('q', busca);
                if (pageNum) {
                    params.set('page', String(pageNum));
                }

                lancamentoUrl = `${BASE_URL}${routeName}?${params.toString()}`;
            } else {
                lancamentoUrl = nameServico.startsWith('http') ? nameServico : `${BASE_URL}${routeName}`;
                const params = new URLSearchParams();
                if (pageNum) {
                    params.set('page', String(pageNum));
                }
                const filterString = this.resolveFilter(req.query);
                if (filterString) {
                    const filterParams = new URLSearchParams(filterString);
                    filterParams.forEach((value, key) => params.set(key, value));
                }
                const queryString = params.toString();
                if (queryString) {
                    lancamentoUrl += `?${queryString}`;
                }
            }

            const pageData = await this.fetchAnimesFromPage(axios, lancamentoUrl);
            let results = Array.isArray(pageData?.animes) ? pageData.animes : [];
            results = results
                .map((item) => this.normalizeResultItem(item))
                .filter(Boolean)
                .filter((anime) => !!anime.title && !!anime.link && (anime.image ? true : true));

            if (nameServico === 'pesquisar') {
                const rawBusca = req.query?.q ?? req.query?.search ?? req.query?.busca ?? req.params?.busca ?? req.params?.query ?? '';
                const busca = String(rawBusca || '').trim();
                const baseResults = [...results];
                results = baseResults.filter((anime) => this.matchesSearchQuery(anime.title, anime.link, busca));
                if (results.length === 0 && baseResults.length > 0) {
                    console.warn('[AnimeFire] Busca filtrada vazia para:', busca, 'Usando resultados brutos como fallback temporário.');
                    results = baseResults;
                }
            }

            const pagination = pageData.pagination;
            console.log('[AnimeFire] resolveLinkAndFilter end:', { nameServico, url: lancamentoUrl, totalResults: results.length, elapsedMs: Date.now() - startedAt });

            const retorno = {
                success: true,
                url: lancamentoUrl,
                results,
                total: results.length,
                pagination,
            };

            if (res) {
                return res.json(retorno);
            }
            return retorno;
        } catch (error) {
            console.error('[AnimeFire] Erro em resolveLinkAndFilter:', error.message);

            if (error.response?.status === 429) {
                const retryAfter = error.response?.headers?.['retry-after'] || 60;
                return res.status(429).json({
                    success: false,
                    error: 'Muitas requisições ao servidor. Por favor, aguarde alguns minutos antes de tentar novamente.',
                    retryAfter,
                    results: [],
                });
            }

            if (res) {
                return res.status(500).json({
                    success: false,
                    error: error.message,
                    results: [],
                });
            }

            return {
                success: false,
                error: error.message,
                results: [],
            };
        }
    }
    async  extractVideo(req, res) {
        return await extractVideo.getVideo(req, res);
    }

    async getEpisodio(req, res) {
        return await listEpisodios.getEpisodios(req, res);
    }
}

module.exports = ClienteAnimeFire;

const axios = require("axios");
const cheerio = require("cheerio");
const FileCache = process.env.GOOGLE_DRIVE_ENABLED === 'true' ? require('./google-drive-cache') : require('./file-cache');

// Configuração hardcoded para evitar problemas de cache do tsx
const ANIMEFIRE_CONFIG = {
    urlPattern: /^https:\/\/(animefire\.one|animefire\.io|animefire\.plus)\/(?:anime|animes)\/.+$/,
    animeSingularBaseUrl: 'https://animefire.one/anime',
    animeBaseUrl: 'https://animefire.one/animes',
    videoUrlPattern: /https:\/\/(animefire\.one|animefire\.io|animefire\.plus)\/video\/[^'"\\s]+/gi
};

class ListEpsodiosAnimes {
    constructor() {
        // Inicializar cache em arquivo para ScraperAPI (TTL: 2 horas padrão, parametrizável via env)
        const { TTL_MS, ENABLED: CACHE_ENABLED } = require('../../../constants/const').CACHE_CONFIG;
        const { ENABLED, CREDENTIALS_PATH, CACHE_FOLDER } = require('../../../constants/const').GOOGLE_DRIVE_CONFIG;
        
        const cacheOptions = { ttlMs: TTL_MS, enabled: CACHE_ENABLED };
        if (ENABLED) {
            this.fileCache = new FileCache({ ...cacheOptions, credentialsPath: CREDENTIALS_PATH, cacheFolder: CACHE_FOLDER });
        } else {
            this.fileCache = new FileCache(cacheOptions);
        }
    }
    async getEpisodios(req, res) {
        try {
            const {link} = req.query;
            if (!link) {
                return res.status(400).json({error: 'Parâmetro link é obrigatório.'});
            }
            if (link && !ANIMEFIRE_CONFIG.urlPattern.test(link)) {
                return res.status(400).json({
                    error: `Formato inválido para anime_link. Deve ser "${ANIMEFIRE_CONFIG.animeSingularBaseUrl}/*" ou "${ANIMEFIRE_CONFIG.animeBaseUrl}/*"`
                });
            }
            let animeSlug = '';
            if (link) {
                const urlParts = link.split('/');
                const animeIndex = urlParts.findIndex(part => part === 'anime' || part === 'animes');
                if (animeIndex !== -1 && urlParts.length > animeIndex + 1) {
                    animeSlug = urlParts[animeIndex + 1];
                }
            }
            let animeTitle = null;
            let animeTitle1 = null;
            let animeImage = null;
            let animeInfo = null;
            let animeSynopsis = null;
            let animeScore = null;
            let animeVotes = null;
            let youtubeTrailer = null;
            let episodes = null;
            if (link) {
                const html = await this.fetchAnimePage(link);
                if (!html) {
                    return res.status(400).json({error: 'Não foi possível acessar a página do anime.'});
                }
                animeSlug = this.extractAnimeSlug(html);
                animeTitle = this.extractAnimeTitle(html);
                animeTitle1 = this.extractAnimeTitle1(html);
                animeImage = this.extractAnimeImage(html);
                animeInfo = this.extractAnimeInfo(html);
                animeSynopsis = this.extractAnimeSynopsis(html);
                animeScore = this.extractAnimeScore(html);
                animeVotes = this.extractAnimeVotes(html);
                youtubeTrailer = this.extractYoutubeTrailer(html);
                episodes = await this.extractEpisodes(html);
            }
            const response = {
                anime_slug: animeSlug,
                anime_title: animeTitle,
                anime_title1: animeTitle1,
                anime_image: animeImage,
                anime_info: animeInfo,
                anime_synopsis: animeSynopsis,
                anime_score: animeScore,
                anime_votes: animeVotes,
                youtube_trailer: youtubeTrailer,
                episodes: episodes,
                response: {
                    status: '200',
                    text: 'OK'
                }
            };
            if (res) {
                res.json(response);
            } else {
                return response;
            }
        } catch (error) {
            console.error('Erro na API:', error);
            res.status(500).json({error: 'Erro interno do servidor.'});
        }
    }

    hasValidAnimeContent(html) {
        if (!html || typeof html !== 'string') return false;
        const normalized = html.replace(/\s+/g, ' ');
        return /EP\.|Assistir T1|Temporada|Dublado & Legendado|Página não encontrada|Atualizar página/i.test(normalized);
    }

    async fetchPageWithBrowser(animeLink) {
        try {
            // Check if playwright is available before requiring it
            let playwright;
            try {
                playwright = require('playwright');
            } catch (e) {
                console.warn('Browser fallback unavailable for episode page: Playwright not installed');
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
            await page.goto(animeLink, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForSelector('h1, [property="og:title"], app-anime-card', { timeout: 20000 }).catch(() => undefined);
            await page.waitForTimeout(3000);
            const html = await page.content();
            await browser.close();
            return this.hasValidAnimeContent(html) ? html : null;
        } catch (error) {
            console.warn('Browser fallback unavailable for episode page:', error.message);
            return null;
        }
    }

    async fetchAnimePage(animeLink) {
        try {
            const useScraperApi = String(process.env.USE_SCRAPERAPI ?? 'false').toLowerCase() === 'true';
            const hasScraperKey = !!(process.env.SCRAPERAPI_KEY && String(process.env.SCRAPERAPI_KEY).trim());
            const isLocal = String(process.env.IS_LOCAL ?? 'true').toLowerCase() === 'true';

            let urlProx = animeLink;
            if (useScraperApi && hasScraperKey) {
                const scraperUrl = process.env.SCRAPERAPI_URL || 'https://api.scraperapi.com';
                const scraperKey = process.env.SCRAPERAPI_KEY;
                const deviceType = process.env.SCRAPERAPI_DEVICE_TYPE || 'desktop';
                const countryCode = process.env.SCRAPERAPI_COUNTRY_CODE || 'br';
                urlProx = `${scraperUrl}/?api_key=${scraperKey}&device_type=${deviceType}&country_code=${countryCode}&url=${encodeURIComponent(animeLink)}`;
            }

            const cached = await this.fileCache.get(urlProx);
            if (cached && this.hasValidAnimeContent(cached.data)) {
                console.log('💾 Cache HIT para episódios:', animeLink);
                return cached.data;
            }

            if (cached) {
                console.log('⚠️ Cache inválido para episódios. Recarregando:', animeLink);
                await this.fileCache.delete(urlProx).catch(() => {});
            }

            console.log(useScraperApi && hasScraperKey ? '🌐 Usando ScraperAPI para episódios:' : '🌐 Acessando AnimeFire diretamente para episódios:', urlProx);
            const response = await axios.get(urlProx, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
                },
                timeout: 45000
            });

            const html = response.data || '';
            if (this.hasValidAnimeContent(html)) {
                await this.fileCache.set(animeLink, { data: html, url: animeLink });
                console.log('✅ ScraperAPI retornou:', html.length, 'bytes');
                return html;
            }

            const browserHtml = await this.fetchPageWithBrowser(animeLink);
            if (browserHtml) {
                await this.fileCache.set(animeLink, { data: browserHtml, url: animeLink });
                return browserHtml;
            }

            return html;
        } catch (error) {
            console.error('❌ Erro ao buscar página do anime via ScraperAPI:', error.message);
            const browserHtml = await this.fetchPageWithBrowser(animeLink);
            if (browserHtml) {
                return browserHtml;
            }
            return null;
        }
    }

    extractAnimeSlug(html) {
        const $ = cheerio.load(html);
        const canonical = $('link[rel="canonical"]').attr('href') || $('meta[property="og:url"]').attr('content') || '';
        if (canonical) {
            const match = canonical.match(/\/(?:anime|animes)\/([^/?#]+)/i);
            if (match) return match[1];
        }

        const slug = $("a[href*='/anime/'], a[href*='/animes/']").first().attr('href');
        if (slug && slug.match(/\/(?:anime|animes)\/([^/?#]+)/i)) {
            return slug.match(/\/(?:anime|animes)\/([^/?#]+)/i)[1];
        }
        return null;
    }

    extractAnimeTitle(html) {
        const $ = cheerio.load(html);
        const title = $('meta[property="og:title"]').attr('content') || $("h1").first().text().trim() || $("h1.quicksand400").first().text().trim();
        return this.cleanText(title);
    }

    extractAnimeTitle1(html) {
        const $ = cheerio.load(html);
        const fullText = $('body').text();
        const temporadasMatch = fullText.match(/(\d+)\s+temporadas/i);
        if (temporadasMatch) {
            return `${temporadasMatch[1]} temporadas`;
        }

        const title1 = $('meta[property="og:description"]').attr('content') || $("h2, h6, span").filter((_, el) => /temporada|sinopse|dublado|legendado/i.test($(el).text())).first().text().trim();
        return this.cleanText(title1 || $("h6.text-gray").first().text().trim());
    }

    extractAnimeImage(html) {
        const $ = cheerio.load(html);
        const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
        if (ogImage) return ogImage;
        const poster = $('img[alt="Poster"]').first().attr('src') || $('img[alt="Poster"]').first().attr('data-src');
        if (poster) return poster;
        return $("img[src*='tmdb'], img[data-src*='tmdb'], img[src*='image'], img[data-src*='image']").first().attr('src') || $("img").first().attr('src') || $("img").first().attr('data-src');
    }

    extractAnimeInfo(html) {
        const $ = cheerio.load(html);
        const infoTexts = [];
        $("a[href*='genre'], .text-brand, .font-bold, .text-muted-foreground").each((i, elem) => {
            const text = this.cleanText($(elem).text().trim());
            if (text && text.length < 40 && !infoTexts.includes(text)) {
                infoTexts.push(text);
            }
        });
        return infoTexts.slice(0, 8).join(', ');
    }

    extractAnimeSynopsis(html) {
        const $ = cheerio.load(html);
        const synopsisFromMeta = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');
        if (synopsisFromMeta) return this.cleanText(synopsisFromMeta);
        const synopsis = $('button, p').filter((_, el) => /Houve um homem|Sinopse|Resumo/i.test($(el).text())).first().text().trim() || $("p").first().text().trim() || $("div.divSinopse span.spanAnimeInfo").first().text().trim();
        return this.cleanText(synopsis);
    }

    extractAnimeScore(html) {
        const $ = cheerio.load(html);
        const bodyText = $('body').text();
        const fromBody = bodyText.match(/(?<!\d)(\d+\.\d+)(?!\d)/);
        if (fromBody) {
            return Number(fromBody[1]);
        }

        const metaText = $('meta[property="og:description"]').attr('content') || '';
        const extractFromText = metaText.match(/\b\d+(?:\.\d+)?\b/);
        if (extractFromText) return Number(extractFromText[0]);
        return Number($("span:contains('•')").filter((_, el) => /\d+(?:\.\d+)?/.test($(el).text())).first().text().trim()) || Number($("h4#anime_score").first().text().trim()) || 0;
    }

    extractAnimeVotes(html) {
        const $ = cheerio.load(html);
        return $("span").filter((_, el) => /\d+ votos?/i.test($(el).text())).first().text().trim() || $("h6#anime_votos").first().text().trim();
    }

    extractYoutubeTrailer(html) {
        const $ = cheerio.load(html);
        return $("div#iframe-trailer iframe").first().attr('src');
    }

    async extractEpisodes(html) {
        const $ = cheerio.load(html);
        const episodeElements = [];
        const seen = new Set();

        $('h3').each((i, elem) => {
            const text = this.cleanText($(elem).text().trim());
            if (!text || !/^EP\.?\s*\d+/i.test(text)) return;
            const key = text;
            if (seen.has(key)) return;
            seen.add(key);
            episodeElements.push({
                href: '#',
                text: text,
            });
        });

        if (episodeElements.length === 0) {
            $('div.div_video_list a.lEp').each((i, elem) => {
                const $episode = $(elem);
                const href = $episode.attr('href');
                const text = $episode.text().trim();
                if (href && text) {
                    episodeElements.push({ href, text });
                }
            });
        }

        return episodeElements;
    }

    cleanText(text) {
        if (!text) return '';
        const unwanted = {
            'ç': 'c', 'Ç': 'C',
            'á': 'a', 'Á': 'A',
            'à': 'a', 'À': 'A',
            'ã': 'a', 'Ã': 'A',
            'â': 'a', 'Â': 'A',
            'é': 'e', 'É': 'E',
            'ê': 'e', 'Ê': 'E',
            'í': 'i', 'Í': 'I',
            'ó': 'o', 'Ó': 'O',
            'õ': 'o', 'Õ': 'O',
            'ô': 'o', 'Ô': 'O',
            'ú': 'u', 'Ú': 'U',
            'ü': 'u', 'Ü': 'U'
        };
        return text.replace(/[çÇáÁàÀãÃâÂéÉêÊíÍóÓõÕôÔúÚüÜ]/g, char => unwanted[char] || char);
    }

}

module.exports = ListEpsodiosAnimes;

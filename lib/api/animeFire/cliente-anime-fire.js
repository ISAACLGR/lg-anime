// Serviço dedicado para filtros de busca de animes
const axios = require("axios");
const ExtractVideo = require('./extract-video');
const extractVideo = new ExtractVideo();
const ListEpsodiosAnimes = require('./list-episodios-animes');
const listEpisodios = new ListEpsodiosAnimes();
const BASE_URL = 'https://animefire.io/'; // Manter URL original para headers

class ClienteAnimeFire {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutos para evitar 429
        this.lastRequestTime = 0;
        this.requestDelay = 8000; // 8 segundos entre requisições (muito mais seguro)
    }
    async waitForRequestDelay() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.requestDelay) {
            const waitTime = this.requestDelay - timeSinceLastRequest;
            console.log(`⏳ Aguardando ${waitTime}ms para evitar rate limiting...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
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

    // Buscar animes da página principal
    async fetchAnimesFromPage(axios, baseUrl) {
        try {
            // Aguardar delay para evitar rate limiting
            await this.waitForRequestDelay();
            // Rotação de User-Aents para evitar bloqueio
            const userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ];
            
            const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            
            const response = await axios.get(baseUrl, {
                headers: {
                    'User-Agent': randomUserAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8,es;q=0.7',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-User': '?1',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Referer': 'https://animefire.io/',
                    'Origin': 'https://animefire.io'
                },
                timeout: 20000,
                maxRedirects: 3
            });
            const cheerio = require('cheerio');
            const $ = cheerio.load(response.data);
            
            // Extrair paginação antes dos animes
            const pagination = this.extractPagination($, baseUrl);
            
            const animes = [];
            $("div.divCardUltimosEps").each((i, elem) => {
                const $card = $(elem);
                const link = $card.find("a").first().attr('href');
                const image = $card.find("img").first().attr('data-src');
                const title = this.cleanText($card.find("h3.animeTitle").first().text().trim());
                const classification = this.cleanText($card.find("div.text-blockCapaAnimeTags span.pr-1").first().text().trim());
                const score = this.cleanText($card.find("span.horaUltimosEps").first().text().trim());
                if (link && image && title) {
                    animes.push({
                        title,
                        image,
                        classification,
                        score,
                        link: link.startsWith('http') ? link : baseUrl + link
                    });
                }
            });
            return {
                animes,
                pagination
            };
        } catch (error) {
            console.error('Erro ao buscar animes da página:', error.message);
            return {
                animes: [],
                pagination: null
            };
        }
    }

    // Limpar cache (para manutenção)
    clearCache() {
        this.cache.clear();
    }

    // Obter estatísticas do cache
    getCacheStats() {
        this.cleanExpiredCache();
        return {
            size: this.cache.size,
            timeout: this.cacheTimeout / 1000 // em segundos
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

    async resolveLinkAndFilter(nameServico, req, res) {
        try {
            if (!nameServico) {
                throw new Error('Nome do serviço é obrigatório');
            }
            let lancamentoUrl;
            let page = '';
            if (req.params.page) {
                page = `/` + req.params.page
            }
            if (nameServico === 'pesquisar') {
                const busca = req.params.busca.toLowerCase().replace(/\s+/g, '-');
                const endpoint = `${nameServico}/${busca}`;
                lancamentoUrl = nameServico.startsWith('http') ? nameServico : `${BASE_URL}/${endpoint}${page}`;
            } else {
                lancamentoUrl = nameServico.startsWith('http') ? nameServico : `${BASE_URL}/${nameServico}${page}`;
                let queryString = this.resolveFilter(req.query)
                if (queryString) {
                    lancamentoUrl += `?${queryString}`;
                }
            }
            const pageData = await this.fetchAnimesFromPage(axios, lancamentoUrl);
            const results = pageData.animes || [];
            const pagination = pageData.pagination;

            let retorno = {
                success: true,
                url: lancamentoUrl,
                results: results,
                total: results.length,
                pagination: pagination
            }
            if (res) {
                return res.json(retorno);
            } else {
                return retorno;
            }
        } catch (error) {
            console.error('Erro em resolveLinkAndFilter:', error.message);
            
            // Tratamento específico para rate limiting
            if (error.response?.status === 429) {
                const retryAfter = error.response?.headers?.['retry-after'] || 60;
                return res.status(429).json({
                    success: false,
                    error: 'Muitas requisições ao servidor. Por favor, aguarde alguns minutos antes de tentar novamente.',
                    retryAfter: retryAfter,
                    results: []
                });
            }
            
            return res.status(500).json({
                success: false,
                error: error.message,
                results: []
            });
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

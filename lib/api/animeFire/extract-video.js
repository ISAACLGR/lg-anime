const axios = require("axios");
const cheerio = require('cheerio');
const FileCache = process.env.GOOGLE_DRIVE_ENABLED === 'true' ? require('./google-drive-cache') : require('./file-cache');

// Configuração hardcoded para evitar problemas de cache do tsx
const ANIMEFIRE_CONFIG = {
    urlPattern: /^https:\/\/(animefire\.one|animefire\.io|animefire\.plus)\/(?:anime|animes)\/.+$/,
    animeSingularBaseUrl: 'https://animefire.one/anime',
    animeBaseUrl: 'https://animefire.one/animes',
    videoUrlPattern: /https:\/\/(animefire\.one|animefire\.io|animefire\.plus)\/video\/[^'"\\s]+/gi
};

class ExtractVideo{
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
    async fetchWithScraper(url, headers = {}) {
        const useScraperApi = String(process.env.USE_SCRAPERAPI ?? 'false').toLowerCase() === 'true';
        const hasScraperKey = !!(process.env.SCRAPERAPI_KEY && String(process.env.SCRAPERAPI_KEY).trim());

        let changeUrl = url;
        if (useScraperApi && hasScraperKey) {
            const scraperUrl = process.env.SCRAPERAPI_URL || 'https://api.scraperapi.com';
            const scraperKey = process.env.SCRAPERAPI_KEY;
            const deviceType = process.env.SCRAPERAPI_DEVICE_TYPE || 'desktop';
            const countryCode = process.env.SCRAPERAPI_COUNTRY_CODE || 'br';
            changeUrl = `${scraperUrl}/?api_key=${scraperKey}&url=${encodeURIComponent(url)}&device_type=${deviceType}&country_code=${countryCode}`;
        }
        const cached = await this.fileCache.get(changeUrl);
        if (cached) {
            console.log('💾 Cache HIT para vídeo:', url);
            return { data: cached.data, cached: true };
        }
        const defaultHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };
        const response = await axios.get(changeUrl, {
            headers: { ...defaultHeaders, ...headers },
            timeout: 45000
        });
        await this.fileCache.set(url, { data: response.data, url });
        return response;
    }
    async getVideo(req, res){
        try {
            const { url } = req.query;
            const targetUrl = url;
            if (!targetUrl ) {
                return res.status(400).json({
                    success: false,
                    error: `URL do episódio é obrigatória. Use: /extract-video?url=${ANIMEFIRE_CONFIG.animeSingularBaseUrl}/nome/episode-1`
                });
            }
            const isValidAnimefireUrl = ANIMEFIRE_CONFIG.urlPattern.test(String(targetUrl));
            if (!isValidAnimefireUrl) {
                return res.status(400).json({
                    success: false,
                    error: `URL deve ser do formato: ${ANIMEFIRE_CONFIG.animeSingularBaseUrl}/nome-do-anime/episode-1 ou ${ANIMEFIRE_CONFIG.animeBaseUrl}/nome-do-anime/episodio`
                });
            }
            console.log('🔍 Extraindo vídeo para:', targetUrl);
            const result = await this.extractVideoUniversal(targetUrl);
            if (res) {
                res.json(result);
            } else {
                return result;
            }
        } catch (error) {
            console.error('Erro no endpoint GET /extract-video:', error.message);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor: ' + error.message
            });
        }
    }

    async  extractVideoUniversal(episodeUrl) {
        const results = {
            success: false,
            episodeUrl: episodeUrl,
            timestamp: new Date().toISOString(),
            method: null,
            videoUrl: null,
            iframeSrc: null,
            metadata: {},
            errors: []
        };

        try {
            console.log('🔧 Tentando método API direta...');
            const apiResult = await this.tryApiMethod(episodeUrl);

            if (apiResult.success) {
                results.success = true;
                results.method = 'api-direta';
                results.videoUrl = apiResult.videoUrl;
                results.metadata = {
                    quality: apiResult.quality,
                    accessibility: apiResult.accessibility,
                    apiData: apiResult.apiData
                };
                // Incluir todas as qualidades se existirem
                if (apiResult.allQualities) {
                    results.allQualities = apiResult.allQualities;
                }
                return results;
            } else {
                results.errors.push(`API Direta: ${apiResult.error}`);
            }

            // Método 2: Tentar iframe da main_div_video
            console.log('📺 Tentando método iframe da main_div_video...');
            const iframeResult = await this.tryIframeMethod(episodeUrl);

            if (iframeResult.success) {
                results.success = true;
                results.method = 'iframe-main-div';
                results.iframeSrc = iframeResult.iframeSrc;
                results.metadata = {
                    iframeInfo: iframeResult.iframeInfo,
                    accessibility: iframeResult.accessibility
                };
                return results;
            } else {
                results.errors.push(`Iframe main_div: ${iframeResult.error}`);
            }
            console.log('🔍 Procurando outros iframes...');
            const otherIframesResult = await this.tryOtherIframesMethod(episodeUrl);

            if (otherIframesResult.success) {
                results.success = true;
                results.method = 'iframe-outro';
                results.iframeSrc = otherIframesResult.iframeSrc;
                results.metadata = {
                    iframeInfo: otherIframesResult.iframeInfo,
                    totalIframes: otherIframesResult.totalIframes
                };
                return results;
            } else {
                results.errors.push(`Outros iframes: ${otherIframesResult.error}`);
            }
            console.log('📜 Procurando URLs em scripts...');
            const scriptsResult = await this.tryScriptsMethod(episodeUrl);
            if (scriptsResult.success) {
                results.success = true;
                results.method = 'scripts';
                results.videoUrl = scriptsResult.videoUrl;
                results.metadata = {
                    totalUrls: scriptsResult.totalUrls,
                    accessibility: scriptsResult.accessibility
                };
                return results;
            } else {
                results.errors.push(`Scripts: ${scriptsResult.error}`);
            }
            results.error = 'Nenhum método de extração funcionou';
            results.allErrors = results.errors;
            return results;

        } catch (error) {
            results.error = error.message;
            results.errors.push(`Geral: ${error.message}`);
            return results;
        }
    }

    normalizeEpisodeNumber(value) {
        if (value === null || value === undefined) {
            return null;
        }

        const rawValue = String(value).trim();
        const match = rawValue.match(/(?:^|[-_/])(?:episode|ep)[-_]?([0-9]+)(?:$|[-_/])/i) || rawValue.match(/^(?:episode|ep)[-_]?([0-9]+)$/i) || rawValue.match(/^([0-9]+)$/);
        if (match) {
            return match[1];
        }

        const digits = rawValue.match(/[0-9]+/);
        return digits ? digits[0] : null;
    }

    async tryApiMethod(episodeUrl) {
        try {
            const urlParts = String(episodeUrl).split('/').filter(Boolean);
            const animeIndex = urlParts.findIndex(part => /^(anime|animes)$/.test(part));
            const videoIndex = urlParts.findIndex(part => /^video$/i.test(part));

            let animeName = null;
            let episodeNumber = null;

            if (animeIndex !== -1 && urlParts.length > animeIndex + 1) {
                animeName = urlParts[animeIndex + 1];
                episodeNumber = urlParts[animeIndex + 2] || null;
            } else if (videoIndex !== -1 && urlParts.length > videoIndex + 2) {
                animeName = urlParts[videoIndex + 1];
                episodeNumber = urlParts[videoIndex + 2];
            }

            if (!episodeNumber) {
                const episodeMatch = episodeUrl.match(/(?:\/|-)episode[-_]?([0-9]+)(?:\/|$)/i) || episodeUrl.match(/(?:\/|-)ep[-_]?([0-9]+)(?:\/|$)/i) || episodeUrl.match(/\/([0-9]+)(?:\/)?$/);
                episodeNumber = episodeMatch ? episodeMatch[1] : null;
            }

            episodeNumber = this.normalizeEpisodeNumber(episodeNumber);
            animeName = decodeURIComponent(String(animeName || '')).replace(/\?.*$/, '').trim();

            if (!animeName || !episodeNumber) {
                return { success: false, error: 'Não foi possível extrair nome do anime ou episódio' };
            }

            const normalizedAnimeName = decodeURIComponent(animeName).replace(/\?.*$/, '').trim();
            const searchUrl = `https://api.animefire.one/animes?q=${encodeURIComponent(normalizedAnimeName)}`;
            console.log(`📺 Pesquisando anime na API: ${searchUrl}`);

            const searchResponse = await this.fetchWithScraper(searchUrl, {
                'Accept': 'application/json',
                'Referer': episodeUrl
            });

            const searchResults = Array.isArray(searchResponse?.data?.data) ? searchResponse.data.data : [];
            const animeMatch = searchResults.find((anime) => {
                const titleVariants = Object.values(anime?.titles || {}).map((title) => String(title).toLowerCase());
                return titleVariants.some((title) => title.includes(normalizedAnimeName.toLowerCase()))
                    || String(anime?.id || '').toLowerCase() === normalizedAnimeName.toLowerCase();
            }) || searchResults[0];

            if (!animeMatch || !animeMatch.id) {
                return { success: false, error: 'Anime não encontrado na API do AnimeFire' };
            }

            const animeDetailUrl = `https://api.animefire.one/anime/${animeMatch.id}?v=3`;
            console.log(`📺 Buscando detalhes do anime: ${animeDetailUrl}`);
            const animeResponse = await this.fetchWithScraper(animeDetailUrl, {
                'Accept': 'application/json',
                'Referer': episodeUrl
            });

            const animeData = animeResponse?.data?.data;
            if (!animeData || !Array.isArray(animeData.episodes)) {
                return { success: false, error: 'Detalhes do anime não retornaram episódios' };
            }

            const matchedEpisode = animeData.episodes.find((ep) => Number(ep.number) === Number(episodeNumber))
                || animeData.episodes.find((ep) => String(ep.number) === String(episodeNumber))
                || animeData.episodes.find((ep) => String(ep.id) === String(episodeNumber));

            if (!matchedEpisode || !matchedEpisode.id) {
                return { success: false, error: `Episódio ${episodeNumber} não encontrado na API do AnimeFire` };
            }

            const episodeDetailUrl = `https://api.animefire.one/episode/${matchedEpisode.id}?v=3`;
            console.log(`📺 Buscando streams do episódio: ${episodeDetailUrl}`);
            const episodeResponse = await this.fetchWithScraper(episodeDetailUrl, {
                'Accept': 'application/json',
                'Referer': episodeUrl
            });

            const streams = Array.isArray(episodeResponse?.data?.data?.streams) ? episodeResponse.data.data.streams : [];
            const availableStreams = streams.filter((stream) => stream && stream.url && !stream.is_offline);

            if (!availableStreams.length) {
                return { success: false, error: 'Nenhum stream válido encontrado para esse episódio' };
            }

            const qualityOrder = (qualityLabel) => {
                const normalized = String(qualityLabel || '0p').toLowerCase();
                const numeric = Number(normalized.replace(/[^0-9]/g, '')) || 0;
                return numeric;
            };

            const preferredAudio = availableStreams.find((stream) => /legendado/i.test(stream.audio))
                || availableStreams.find((stream) => /dublado/i.test(stream.audio))
                || availableStreams[0];

            const candidates = preferredAudio ? availableStreams.filter((stream) => stream.audio === preferredAudio.audio) : availableStreams;
            const bestStream = [...candidates].sort((a, b) => {
                const aBest = [...(a.qualities || [])].sort((x, y) => qualityOrder(y) - qualityOrder(x))[0] || '0p';
                const bBest = [...(b.qualities || [])].sort((x, y) => qualityOrder(y) - qualityOrder(x))[0] || '0p';
                return qualityOrder(bBest) - qualityOrder(aBest);
            })[0] || candidates[0];

            const videoUrl = String(bestStream.url);
            const quality = [...(bestStream.qualities || [])].sort((a, b) => qualityOrder(b) - qualityOrder(a))[0] || '480p';

            const allQualities = Array.from(
                new Map(
                    availableStreams.flatMap((stream) => {
                        const qualityList = Array.isArray(stream.qualities) && stream.qualities.length > 0 ? stream.qualities : ['480p'];
                        return qualityList.map((label) => {
                            const normalizedLabel = String(label || '480p').trim();
                            return [normalizedLabel.toLowerCase(), { label: normalizedLabel, src: stream.url, size: stream.audio || 'stream', audio: stream.audio }];
                        });
                    })
                ).values()
            ).sort((a, b) => qualityOrder(b.label) - qualityOrder(a.label));

            try {
                const videoResponse = await axios.head(videoUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': episodeUrl
                    }
                });

                const contentType = String(videoResponse.headers['content-type'] || '');
                if (!contentType.toLowerCase().includes('video') && !contentType.toLowerCase().includes('mpegurl') && !videoUrl.toLowerCase().includes('h.jpg')) {
                    return { success: false, error: `URL de vídeo inválida para o retorno da API (${contentType || 'sem content-type'})` };
                }

                return {
                    success: true,
                    videoUrl,
                    quality,
                    allQualities,
                    accessibility: {
                        status: videoResponse.status,
                        contentType: contentType || 'application/vnd.apple.mpegurl',
                        contentLength: videoResponse.headers['content-length']
                    },
                    apiData: {
                        animeId: animeMatch.id,
                        episodeId: matchedEpisode.id,
                        episodeNumber: matchedEpisode.number,
                        streamsCount: availableStreams.length,
                        audio: bestStream.audio
                    }
                };
            } catch (headError) {
                return {
                    success: true,
                    videoUrl,
                    quality,
                    allQualities,
                    accessibility: {
                        status: 'failed',
                        error: headError.message
                    },
                    apiData: {
                        animeId: animeMatch.id,
                        episodeId: matchedEpisode.id,
                        episodeNumber: matchedEpisode.number,
                        streamsCount: availableStreams.length,
                        audio: bestStream.audio
                    },
                    note: 'URL encontrada mas não acessível diretamente via HEAD'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async  tryIframeMethod(episodeUrl) {
        try {
            const response = await this.fetchWithScraper(episodeUrl);
            const $ = cheerio.load(response.data);
            const mainDivVideo = $('#main_div_video');

            if (mainDivVideo.length === 0) {
                return {
                    success: false,
                    error: 'Div main_div_video não encontrada'
                };
            }

            const firstIframe = mainDivVideo.find('iframe').first();

            if (firstIframe.length === 0) {
                return {
                    success: false,
                    error: 'Nenhum iframe encontrado na div main_div_video'
                };
            }

            const iframeSrc = firstIframe.attr('src');

            if (!iframeSrc) {
                return {
                    success: false,
                    error: 'Iframe encontrado mas sem atributo src'
                };
            }
            try {
                const iframeResponse = await axios.head(iframeSrc, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': episodeUrl
                    }
                });
                return {
                    success: true,
                    iframeSrc: iframeSrc,
                    accessibility: {
                        status: iframeResponse.status,
                        contentType: iframeResponse.headers['content-type']
                    },
                    iframeInfo: {
                        id: firstIframe.attr('id'),
                        class: firstIframe.attr('class'),
                        width: firstIframe.attr('width') || '100%',
                        height: firstIframe.attr('height') || '400px'
                    }
                };
            } catch (iframeError) {
                return {
                    success: true,
                    iframeSrc: iframeSrc,
                    accessibility: {
                        status: 'failed',
                        error: iframeError.message
                    },
                    iframeInfo: {
                        id: firstIframe.attr('id'),
                        class: firstIframe.attr('class'),
                        width: firstIframe.attr('width') || '100%',
                        height: firstIframe.attr('height') || '400px'
                    },
                    note: 'Iframe encontrado mas não acessível diretamente'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async  tryOtherIframesMethod(episodeUrl) {
        try {
            const response = await this.fetchWithScraper(episodeUrl);
            const $ = cheerio.load(response.data);
            const iframes = [];

            $('iframe').each((i, elem) => {
                const $iframe = $(elem);
                const src = $iframe.attr('src');

                if (src) {
                    iframes.push({
                        index: i,
                        src: src,
                        id: $iframe.attr('id'),
                        class: $iframe.attr('class')
                    });
                }
            });

            if (iframes.length === 0) {
                return {
                    success: false,
                    error: 'Nenhum iframe encontrado na página'
                };
            }
            for (const iframe of iframes) {
                try {
                    const iframeResponse = await axios.head(iframe.src, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Referer': episodeUrl
                        }
                    });

                    return {
                        success: true,
                        iframeSrc: iframe.src,
                        accessibility: {
                            status: iframeResponse.status,
                            contentType: iframeResponse.headers['content-type']
                        },
                        iframeInfo: iframe,
                        totalIframes: iframes.length
                    };
                } catch (error) {
                    continue; // Tentar o próximo iframe
                }
            }

            return {
                success: false,
                error: 'Nenhum iframe acessível',
                totalIframes: iframes.length,
                iframes: iframes
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async  tryScriptsMethod(episodeUrl) {
        try {
            const response = await this.fetchWithScraper(episodeUrl);
            const $ = cheerio.load(response.data);
            let videoUrls = [];

            $('script').each((i, elem) => {
                const scriptContent = $(elem).html() || '';

                // Procurar por padrões de URL de vídeo
                const urlPatterns = [
                    ANIMEFIRE_CONFIG.videoUrlPattern,
                    /https:\/\/lightspeedst\.net\/[^'"\s]+/gi,
                    /https:\/\/[^'"\s]*\.mp4[^'"\s]*/gi
                ];

                urlPatterns.forEach(pattern => {
                    const matches = scriptContent.match(pattern);
                    if (matches) {
                        videoUrls.push(...matches);
                    }
                });
            });

            if (videoUrls.length === 0) {
                return {
                    success: false,
                    error: 'Nenhuma URL de vídeo encontrada nos scripts'
                };
            }

            // Testar cada URL
            for (const url of videoUrls) {
                try {
                    const videoResponse = await axios.head(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Referer': episodeUrl
                        }
                    });

                    if (videoResponse.status === 200 && videoResponse.headers['content-type']?.includes('video')) {
                        return {
                            success: true,
                            videoUrl: url,
                            accessibility: {
                                status: videoResponse.status,
                                contentType: videoResponse.headers['content-type'],
                                contentLength: videoResponse.headers['content-length']
                            },
                            totalUrls: videoUrls.length
                        };
                    }
                } catch (error) {
                    continue;
                }
            }

            return {
                success: false,
                error: 'Nenhuma URL de vídeo funcional encontrada',
                totalUrls: videoUrls.length,
                urls: videoUrls
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}
module.exports = ExtractVideo;


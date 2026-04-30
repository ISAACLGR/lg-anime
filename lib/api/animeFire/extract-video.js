const axios = require("axios");
const cheerio = require('cheerio');
class ExtractVideo{
    async getVideo(req, res){
        try {
            const { url } = req.query;
            const targetUrl = url;
            if (!targetUrl ) {
                return res.status(400).json({
                    success: false,
                    error: 'URL do episódio é obrigatória. Use: /extract-video?url=https://animefire.io/animes/nome/episodio'
                });
            }
            if (!targetUrl.includes('animefire.io/animes/')) {
                return res.status(400).json({
                    success: false,
                    error: 'URL deve ser do formato: https://animefire.io/animes/nome-do-anime/episodio'
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

    async  tryApiMethod(episodeUrl) {
        try {
            const urlParts = episodeUrl.split('/');
            const animeIndex = urlParts.indexOf('animes');
            if (animeIndex === -1 || urlParts.length <= animeIndex + 2) {
                return {
                    success: false,
                    error: 'URL não parece ser do animefire.io/animes'
                };
            }
            const animeName = urlParts[animeIndex + 1];
            const episodeNumber = urlParts[animeIndex + 2];
            if (!animeName || !episodeNumber) {
                return {
                    success: false,
                    error: 'Não foi possível extrair nome do anime ou episódio'
                };
            }
            const apiUrl = `https://animefire.io/video/${animeName}/${episodeNumber}`;
            console.log(`📺 Tentando API: ${apiUrl}`);
            const response = await axios.get(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': episodeUrl
                }
            });
            if (response.data.data && response.data.data.length > 0) {
                const allVideos = response.data.data;
                const qualities = allVideos.map(video => ({
                    label: video.label,
                    src: video.src,
                    size: video.size || 'unknown'
                }));
                const bestQuality = allVideos.reduce((best, current) => {
                    const currentRes = parseInt(current.label) || 0;
                    const bestRes = parseInt(best.label) || 0;
                    return currentRes > bestRes ? current : best;
                });
                const videoUrl = bestQuality.src;
                console.log(`📺 Qualidades encontradas: ${qualities.length}`);
                qualities.forEach((q, i) => {
                    console.log(`   ${i + 1}. ${q.label} - ${q.size}`);
                });
                try {
                    const videoResponse = await axios.head(videoUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Referer': episodeUrl
                        }
                    });
                    return {
                        success: true,
                        videoUrl: videoUrl,
                        quality: bestQuality.label,
                        allQualities: qualities,
                        accessibility: {
                            status: videoResponse.status,
                            contentType: videoResponse.headers['content-type'],
                            contentLength: videoResponse.headers['content-length']
                        },
                        apiData: {
                            metadata: response.data.metadata,
                            response: response.data.response
                        }
                    };
                } catch (videoError) {
                    return {
                        success: true,
                        videoUrl: videoUrl,
                        quality: bestQuality.label,
                        allQualities: qualities,
                        accessibility: {
                            status: 'failed',
                            error: videoError.message
                        },
                        apiData: {
                            metadata: response.data.metadata,
                            response: response.data.response
                        },
                        note: 'URL encontrada mas não acessível diretamente via HEAD'
                    };
                }
            } else {
                return {
                    success: false,
                    error: 'API não retornou dados de vídeo',
                    apiResponse: response.data
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
            const response = await axios.get(episodeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

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
            const response = await axios.get(episodeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

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
            const response = await axios.get(episodeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            let videoUrls = [];

            $('script').each((i, elem) => {
                const scriptContent = $(elem).html() || '';

                // Procurar por padrões de URL de vídeo
                const urlPatterns = [
                    /https:\/\/animefire\.io\/video\/[^'"\s]+/gi,
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


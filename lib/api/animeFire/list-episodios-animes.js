const axios = require("axios");
const cheerio = require("cheerio");
const FileCache = require('./file-cache');
const BASE_IP = '104.21.76.30'; // IP direto do animefire.plus

class ListEpsodiosAnimes {
    constructor() {
        // Inicializar cache em arquivo para ScraperAPI (TTL: 2 horas padrão, parametrizável via env)
        const fileCacheTtl = parseInt(process.env.CACHE_TTL_MS) || 2 * 60 * 60 * 1000;
        this.fileCache = new FileCache({ ttlMs: fileCacheTtl });
    }
    async getEpisodios(req, res) {
        try {
            const {link} = req.query;
            if (!link) {
                return res.status(400).json({error: 'Parâmetro link é obrigatório.'});
            }
            if (link && !link.match(/^https:\/\/(animefire\.plus|animefire\.io)\/animes\/.+/)) {
                return res.status(400).json({
                    error: 'Formato inválido para anime_link. Deve ser "https://animefire.plus/animes/*" ou "https://animefire.io/animes/*"'
                });
            }
            let animeSlug = '';
            if (link) {
                const urlParts = link.split('/');
                const animeIndex = urlParts.indexOf('animes');
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

    async fetchAnimePage(animeLink) {
        try {
            // Verificar se está em modo local (sem chamadas externas)
            let urlProx = animeLink;
            if (!process.env.IS_LOCAL === 'true') {
                urlProx = `https://api.scraperapi.com/?api_key=08d973cbf0af4a48f4f5dbb373475b9d&url=${encodeURIComponent(animeLink)}&device_type=desktop&country_code=br`;
            }
            // Usar ScraperAPI para contornar bloqueio do Cloudflare

            // Verificar cache primeiro
            const cached = await this.fileCache.get(urlProx);
            if (cached) {
                console.log('💾 Cache HIT para episódios:', animeLink);
                return cached.data;
            }

            console.log('🌐 Usando ScraperAPI para episódios:', urlProx);

            const response = await axios.get(urlProx, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
                },
                timeout: 45000
            });

            // Salvar no cache SQLite
            await this.fileCache.set(animeLink, { data: response.data, url: animeLink });
            
            console.log('✅ ScraperAPI retornou:', response.data.length, 'bytes');
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao buscar página do anime via ScraperAPI:', error.message);
            return null;
        }
    }

    extractAnimeSlug(html) {
        const $ = cheerio.load(html);
        const slug = $("div.div_video_list a").first().attr('href');
        if (slug && slug.match(/\/animes\/([^/]+)/)) {
            return slug.match(/\/animes\/([^/]+)/)[1];
        }
        return null;
    }

    extractAnimeTitle(html) {
        const $ = cheerio.load(html);
        return this.cleanText($("h1.quicksand400").first().text().trim());
    }

    extractAnimeTitle1(html) {
        const $ = cheerio.load(html);
        return this.cleanText($("h6.text-gray").first().text().trim());
    }

    extractAnimeImage(html) {
        const $ = cheerio.load(html);
        return $("div.sub_animepage_img img").first().attr('data-src');
    }

    extractAnimeInfo(html) {
        const $ = cheerio.load(html);
        const infoTexts = [];
        $("div.animeInfo a").each((i, elem) => {
            infoTexts.push(this.cleanText($(elem).text().trim()));
        });
        return infoTexts.join(", ");
    }

    extractAnimeSynopsis(html) {
        const $ = cheerio.load(html);
        return this.cleanText($("div.divSinopse span.spanAnimeInfo").first().text().trim());
    }

    extractAnimeScore(html) {
        const $ = cheerio.load(html);
        return $("h4#anime_score").first().text().trim();
    }

    extractAnimeVotes(html) {
        const $ = cheerio.load(html);
        return $("h6#anime_votos").first().text().trim();
    }

    extractYoutubeTrailer(html) {
        const $ = cheerio.load(html);
        return $("div#iframe-trailer iframe").first().attr('src');
    }

    async extractEpisodes(html) {
        const $ = cheerio.load(html);
        const episodeElements = [];
        $('div.div_video_list a.lEp').each((i, elem) => {
            const $episode = $(elem);
            const href = $episode.attr('href');
            const text = $episode.text().trim();
            if (href && text) {
                episodeElements.push({
                    href: href,
                    text: text
                });
            }
        });
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

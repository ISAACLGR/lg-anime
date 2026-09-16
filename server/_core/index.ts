import "dotenv/config";
import express from "express";
import {createServer} from "http";
import net from "net";
import {createExpressMiddleware} from "@trpc/server/adapters/express";
import {registerOAuthRoutes} from "./oauth";
import {appRouter} from "../routers";
import {createContext} from "./context";

// Import AnimeFire API
const ApiFireAnime = require("../../lib/api/animeFire/api-fire-anime");
const apiFireAnime = new ApiFireAnime();
const axios = require('axios');

function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, () => {
            server.close(() => resolve(true));
        });
        server.on("error", () => resolve(false));
    });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
    for (let port = startPort; port < startPort + 20; port++) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
    const app = express();
    const server = createServer(app);

    // Enable CORS for all routes - reflect the request origin to support credentials
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        if (origin) {
            res.header("Access-Control-Allow-Origin", origin);
        }
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization",
        );
        res.header("Access-Control-Allow-Credentials", "true");

        // Handle preflight requests
        if (req.method === "OPTIONS") {
            res.sendStatus(200);
            return;
        }
        next();
    });

    app.use(express.json({limit: "50mb"}));
    app.use(express.urlencoded({limit: "50mb", extended: true}));

    registerOAuthRoutes(app);

    app.get("/api/health", (_req, res) => {
        res.json({ok: true, timestamp: Date.now()});
    });

    app.get("/api/animefire/em-lancamento/:page?", async (req, res) => {
        try {
            const result = await apiFireAnime.emLancamento(req);
            res.json(result);
        } catch (error) {
            console.error("[AnimeFire] em-lancamento error:", error);
            res.status(500).json({error: "Failed to fetch data from AnimeFire"});
        }
    });

    app.get("/api/animefire/top-animes/:page?", async (req, res) => {
        try {
            const result = await apiFireAnime.topAnimes(req);
            res.json(result);
        } catch (error) {
            console.error("[AnimeFire] top-animes error:", error);
            res.status(500).json({error: "Failed to fetch data from AnimeFire"});
        }
    });

    app.get("/api/animefire/pesquisar", async (req, res) => {
        try {
            const result = await apiFireAnime.pesquisar(req);
            res.json(result);
        } catch (error) {
            console.error("[AnimeFire] pesquisar error:", error);
            res.status(500).json({error: "Failed to fetch data from AnimeFire"});
        }
    });

    app.get("/api/animefire/animes-atualizados/:page?", async (req, res) => {
        try {
            const result = await apiFireAnime.animesAtualizados(req);
            res.json(result);
        } catch (error) {
            console.error("[AnimeFire] animes-atualizados error:", error);
            res.status(500).json({error: "Failed to fetch data from AnimeFire"});
        }
    });

    app.get("/api/animefire/lista-de-animes-legendados/:page?", async (req, res) => {
        try {
            const result = await apiFireAnime.listaDeAnimesLegendados(req);
            res.json(result);
        } catch (error) {
            console.error("[AnimeFire] lista-de-animes-legendados error:", error);
            res.status(500).json({error: "Failed to fetch data from AnimeFire"});
        }
    });

    app.get("/api/animefire/lista-de-animes-dublados/:page?", async (req, res) => {
        try {
            const result = await apiFireAnime.listaDeAnimesDublados(req);
            res.json(result);
        } catch (error) {
            console.error("[AnimeFire] lista-de-animes-dublados error:", error);
            res.status(500).json({error: "Failed to fetch data from AnimeFire"});
        }
    });

    app.get("/api/animefire/getEpisodio", async (req, res) => {
        try {
            const result = await apiFireAnime.getEpisodio(req);
            res.json(result);
        } catch (error) {
            console.error("[AnimeFire] lista-de-animes-dublados error:", error);
            res.status(500).json({error: "Failed to fetch data from AnimeFire"});
        }
    });

    app.get("/api/animefire/extractVideo", async (req, res) => {
        try {
            const result = await apiFireAnime.extractVideo(req);
            res.json(result);
        } catch (error) {
            console.error("[AnimeFire] lista-de-animes-dublados error:", error);
            res.status(500).json({error: "Failed to fetch data from AnimeFire"});
        }
    });

    // Cache stats endpoint
    app.get("/api/animefire/cache/stats", async (_req, res) => {
        try {
            const ClienteAnimeFire = require("../../lib/api/animeFire/cliente-anime-fire");
            const cliente = new ClienteAnimeFire();
            const stats = await cliente.getCacheStats();
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                cache: stats
            });
        } catch (error: any) {
            console.error("[Cache] Error getting stats:", error);
            res.status(500).json({error: "Failed to get cache stats"});
        }
    });

    // Clear cache endpoint
    app.post("/api/animefire/cache/clear", async (_req, res) => {
        try {
            const ClienteAnimeFire = require("../../lib/api/animeFire/cliente-anime-fire");
            const cliente = new ClienteAnimeFire();
            await cliente.clearCache();
            res.json({
                success: true,
                message: "Cache cleared successfully",
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            console.error("[Cache] Error clearing cache:", error);
            res.status(500).json({error: "Failed to clear cache"});
        }
    });

    // Proxy para v?deos com cookies, headers e Range Requests (suporte a seek)
    const rewriteHlsPlaylist = (playlistText: string, playlistUrl: string, episodeUrl: string, req: any) => {
        const proxyBase = `${req.protocol}://${req.get('host')}/proxy-video`;

        return playlistText
            .split(/\r?\n/)
            .map((line) => {
                if (!line) {
                    return line;
                }

                const urlMatch = line.match(/(?:URI|VALUE)=(?:"([^"]+)"|'([^']+)'|([^\s,]+))/i);
                if (urlMatch) {
                    const rawUrl = urlMatch[1] || urlMatch[2] || urlMatch[3];
                    if (rawUrl) {
                        try {
                            const absoluteLine = new URL(rawUrl, playlistUrl).toString();
                            return line.replace(rawUrl, `${proxyBase}?videoUrl=${encodeURIComponent(absoluteLine)}&episodeUrl=${encodeURIComponent(episodeUrl)}`);
                        } catch {
                            return line;
                        }
                    }
                }

                if (line.startsWith('#')) {
                    return line;
                }

                try {
                    const absoluteLine = new URL(line, playlistUrl).toString();
                    return `${proxyBase}?videoUrl=${encodeURIComponent(absoluteLine)}&episodeUrl=${encodeURIComponent(episodeUrl)}`;
                } catch {
                    return line;
                }
            })
            .join('\n');
    };

    const isMp4Fragment = (buffer: Buffer) => {
        if (!buffer || buffer.length < 8) {
            return false;
        }

        const signatures = ['moov', 'moof', 'ftyp', 'mdat'];
        const tag = buffer.subarray(4, 8).toString('ascii', 0, 4);
        return signatures.includes(tag) || signatures.includes(buffer.subarray(0, 4).toString('ascii'));
    };

    app.get('/proxy-video', async (req, res) => {
        try {
            const {videoUrl, episodeUrl} = req.query;
            if (!videoUrl) {
                return res.status(400).json({error: 'URL do v?deo ? obrigat?ria'});
            }
            console.log('? Proxy para v?deo:', videoUrl);

            const range = req.headers.range;
            if (range) {
                console.log('? Range request:', range);
            }

            let cookies = '';
            if (episodeUrl) {
                try {
                    const pageResponse = await axios.get(episodeUrl as string, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    const setCookieHeaders = pageResponse.headers['set-cookie'];
                    if (setCookieHeaders) {
                        cookies = setCookieHeaders.map((cookie: string) => cookie.split(';')[0]).join('; ');
                        console.log('? Cookies obtidos:', cookies);
                    }
                } catch (error: any) {
                    console.error('Erro ao obter cookies:', error.message);
                }
            }

            const videoHeaders: any = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': episodeUrl || 'https://animefire.io/',
                'Cookie': cookies
            };

            if (range) {
                videoHeaders['Range'] = range;
            }

            const videoResponse = await axios.get(videoUrl as string, {
                headers: videoHeaders,
                responseType: 'stream'
            });

            const contentType = String(videoResponse.headers['content-type'] || 'video/mp4');
            const isHlsPlaylist = contentType.toLowerCase().includes('mpegurl') || String(videoUrl).toLowerCase().includes('.m3u8') || String(videoUrl).toLowerCase().includes('h.jpg');
            const shouldInspectBody = isHlsPlaylist || contentType.toLowerCase().includes('image/jpeg') || contentType.toLowerCase().includes('image/png');

            let finalContentType = contentType;
            if (isHlsPlaylist) {
                finalContentType = 'application/vnd.apple.mpegurl';
            }

            let payload: Buffer | null = null;
            if (shouldInspectBody) {
                const chunks: Buffer[] = [];
                for await (const chunk of videoResponse.data) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
                payload = Buffer.concat(chunks);

                if (!isHlsPlaylist && payload.length > 8 && (contentType.toLowerCase().includes('image/jpeg') || contentType.toLowerCase().includes('image/png'))) {
                    if (isMp4Fragment(payload)) {
                        finalContentType = 'video/mp4';
                    }
                }
            }

            res.setHeader('Content-Type', finalContentType);
            res.setHeader('Content-Disposition', 'inline; filename="video.mp4"');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Range');

            if (isHlsPlaylist) {
                const playlistText = (payload || Buffer.from('')).toString('utf8');
                const rewrittenText = rewriteHlsPlaylist(playlistText, String(videoUrl), String(episodeUrl || ''), req);
                return res.send(rewrittenText);
            }

            if (payload) {
                if (videoResponse.headers['content-range']) {
                    res.setHeader('Content-Range', videoResponse.headers['content-range']);
                    if (videoResponse.headers['content-length']) {
                        res.setHeader('Content-Length', String(videoResponse.headers['content-length']));
                    }
                    res.status(206);
                    console.log('?  Streaming parcial (206):', videoResponse.headers['content-range']);
                } else {
                    if (videoResponse.headers['content-length']) {
                        res.setHeader('Content-Length', String(videoResponse.headers['content-length']));
                    }
                    res.status(200);
                }
                return res.end(payload);
            }

            if (videoResponse.headers['content-range']) {
                res.setHeader('Content-Range', videoResponse.headers['content-range']);
                if (videoResponse.headers['content-length']) {
                    res.setHeader('Content-Length', String(videoResponse.headers['content-length']));
                }
                res.status(206);
                console.log('?  Streaming parcial (206):', videoResponse.headers['content-range']);
            } else {
                if (videoResponse.headers['content-length']) {
                    res.setHeader('Content-Length', String(videoResponse.headers['content-length']));
                }
                res.status(200);
            }

            videoResponse.data.pipe(res);

        } catch (error: any) {
            console.error('? Erro no proxy de v?deo:', error.message);
            res.status(500).json({error: 'Erro ao acessar v?deo via proxy'});
        }
    });

    app.use(
        "/api/trpc",
        createExpressMiddleware({
            router: appRouter,
            createContext,
        }),
    );

    const preferredPort = parseInt(process.env.PORT || "3000");
    const port = await findAvailablePort(preferredPort);

    if (port !== preferredPort) {
        console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }

    server.listen(port, () => {
        console.log(`[api] server listening on port ${port}`);
    });
}

startServer().catch(console.error);

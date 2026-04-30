const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const ClienteAnimeFire = require('./cliente-anime-fire');
const dns = require('dns');
require('dotenv').config();

// Configurar DNS para evitar problemas de resolução
dns.setServers(['8.8.8.8', '1.1.1.1', '208.67.222.222']);

const app = express();
const PORT = process.env.PORT || 3001;

// Instanciar serviço de filtros
const clienteAnimeFire = new ClienteAnimeFire();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'file://'],
    credentials: true
}));
app.use(express.json());

// Servir arquivos estáticos da aplicação React
const buildPath = path.join(__dirname, 'build');

// Forçar uso do build (produção)
app.use(express.static(buildPath));

// Endpoint principal para servir a aplicação React
app.get('/', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Fallback: página HTML simples
        res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AnFire API - Servidor</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .endpoint code { background: #e8e8e8; padding: 2px 5px; border-radius: 3px; }
        .method { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🔥 AnFire API - Servidor Online</h1>
    <p>API para consulta de animes está funcionando!</p>
    
    <h2>📋 Endpoints Disponíveis:</h2>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/em-lancamento</code> - Animes em lançamento
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <code>/em-lancamento/:page</code> - Paginação
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/animes-atualizados</code> - Animes atualizados
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <code>/animes-atualizados/:page</code> - Paginação
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/top-animes</code> - Top animes
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <code>/top-animes/:page</code> - Paginação
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/lista-de-animes-legendados</code> - Legendados
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <code>/lista-de-animes-legendados/:page</code> - Paginação
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/lista-de-animes-dublados</code> - Dublados
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <code>/lista-de-animes-dublados/:page</code> - Paginação
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/pesquisar/:busca</code> - Buscar animes
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <code>/pesquisar/:busca/:page</code> - Busca com paginação
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/api?api_key=CHAVE&anime_slug=NOME</code> - API principal
    </div>
    
    <h2>🚀 Para usar a interface React:</h2>
    <p>Execute os seguintes comandos:</p>
    <pre><code># Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start

# Ou build para produção
npm run build</code></pre>
    
    <p>Após o build, acesse: <a href="http://localhost:3001">http://localhost:3001</a></p>
</body>
</html>
        `);
    }
});

// Configurações
const API_KEY = process.env.API_KEY || 'anfire123';
const BASE_URL = 'https://animefire.io/'; // Manter URL original para headers
const BASE_IP = '104.21.76.30'; // IP direto do animefire.plus

// Validação de API Key
function validateApiKey(req, res, next) {
    const apiKey = req.query.api_key || req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(403).json({ error: 'API Key inválida ou ausente.' });
    }
    next();
}

function formatUrl(url) {
    return url.replace(/[\/\\]/g, '/');
}

app.get('/api', validateApiKey, async (req, res) => {
    await clienteAnimeFire.getEpisodio(req, res)
});

// Endpoint de busca (similar ao index.php)
app.get('/pesquisar/:busca', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter('pesquisar', req, res)
});

app.get('/pesquisar/:busca/:page', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter('pesquisar', req, res)
});

app.get('/em-lancamento', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter('em-lancamento', req, res)
});

app.get('/em-lancamento/:page', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter('em-lancamento', req, res)
});

app.get('/animes-atualizados', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter('animes-atualizados', req, res)
});

app.get('/animes-atualizados/:page', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter('animes-atualizados', req, res)
});

app.get('/top-animes', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter('top-animes', req, res)
});

app.get('/top-animes/:page', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter("top-animes", req, res)
});

app.get('/lista-de-animes-legendados', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter('lista-de-animes-legendados', req, res)
});

app.get('/lista-de-animes-legendados/:page', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter('lista-de-animes-legendados', req, res)
});

app.get('/lista-de-animes-dublados', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter('lista-de-animes-dublados', req, res)
});

app.get('/lista-de-animes-dublados/:page', async (req, res) => {
    await clienteAnimeFire.resolveLinkAndFilter('lista-de-animes-dublados', req, res)
});

// Endpoint para estatísticas do cache
app.get('/filter-service/stats', (req, res) => {
    try {
        const stats = clienteAnimeFire.getCacheStats();
        res.json({
            success: true,
            service: 'anime-filter-service-cache-stats',
            timestamp: new Date().toISOString(),
            cache: stats
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas do cache:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter estatísticas do cache'
        });
    }
});

// Endpoint para limpar cache
app.post('/filter-service/clear-cache', (req, res) => {
    try {
        clienteAnimeFire.clearCache();
        res.json({
            success: true,
            message: 'Cache limpo com sucesso',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao limpar cache:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao limpar cache'
        });
    }
});

// Endpoint universal para extração de vídeo - detecta automaticamente API direta ou iframe
app.post('/extract-video', async (req, res) => {
    return await clienteAnimeFire.extractVideo(req, res);
});

// Endpoint GET para facilitar uso direto no navegador
app.get('/extract-video', async (req, res) => {
    return await clienteAnimeFire.extractVideo(req, res);
});

// Endpoint de proxy para acessar vídeo com cookies da sessão
app.get('/proxy-video', async (req, res) => {
    try {
        const { videoUrl, episodeUrl } = req.query;
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'URL do vídeo é obrigatória' });
        }
        
        console.log('🔧 Proxy para vídeo:', videoUrl);
        
        // Primeiro, acessar a página do episódio para obter cookies
        let cookies = '';
        if (episodeUrl) {
            try {
                const pageResponse = await axios.get(episodeUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                // Extrair cookies da resposta
                const setCookieHeaders = pageResponse.headers['set-cookie'];
                if (setCookieHeaders) {
                    cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
                    console.log('🍪 Cookies obtidos:', cookies);
                }
            } catch (error) {
                console.error('Erro ao obter cookies:', error.message);
            }
        }
        
        // Fazer request para o vídeo com os cookies
        const videoResponse = await axios.get(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': episodeUrl || 'https://animefire.io/',
                'Cookie': cookies
            },
            responseType: 'stream'
        });
        
        // Retornar o vídeo como stream
        res.setHeader('Content-Type', videoResponse.headers['content-type']);
        res.setHeader('Content-Disposition', 'inline; filename="video.mp4"');
        videoResponse.data.pipe(res);
        
    } catch (error) {
        console.error('Erro no proxy de vídeo:', error.message);
        res.status(500).json({ error: 'Erro ao acessar vídeo via proxy' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`Busca: http://localhost:${PORT}/search`);
    console.log(`Interface: http://localhost:${PORT}/`);
});

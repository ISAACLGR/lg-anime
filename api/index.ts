import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import axios from 'axios';

let apiFireAnime: any = null;

async function getApiFireAnime() {
  if (!apiFireAnime) {
    const ApiFireAnime = (await import('../lib/api/animeFire/api-fire-anime.js')).default;
    apiFireAnime = new ApiFireAnime();
  }
  return apiFireAnime;
}

const app = express();

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.get('/api/animefire/em-lancamento/:page?', async (req, res) => {
  try {
    const api = await getApiFireAnime();
    const result = await api.emLancamento(req);
    res.json(result);
  } catch (error) {
    console.error('[AnimeFire] em-lancamento error:', error);
    res.status(500).json({ error: 'Failed to fetch data from AnimeFire' });
  }
});

app.get('/api/animefire/pesquisar', async (req, res) => {
  try {
    const api = await getApiFireAnime();
    const result = await api.pesquisar(req);
    res.json(result);
  } catch (error) {
    console.error('[AnimeFire] pesquisar error:', error);
    res.status(500).json({ error: 'Failed to fetch data from AnimeFire' });
  }
});

app.get('/api/animefire/lista-de-animes-legendados/:page?', async (req, res) => {
  try {
    const api = await getApiFireAnime();
    const result = await api.listaDeAnimesLegendados(req);
    res.json(result);
  } catch (error) {
    console.error('[AnimeFire] lista-de-animes-legendados error:', error);
    res.status(500).json({ error: 'Failed to fetch data from AnimeFire' });
  }
});

app.get('/api/animefire/lista-de-animes-dublados/:page?', async (req, res) => {
  try {
    const api = await getApiFireAnime();
    const result = await api.listaDeAnimesDublados(req);
    res.json(result);
  } catch (error) {
    console.error('[AnimeFire] lista-de-animes-dublados error:', error);
    res.status(500).json({ error: 'Failed to fetch data from AnimeFire' });
  }
});

app.get('/api/animefire/getEpisodio', async (req, res) => {
  try {
    const api = await getApiFireAnime();
    const result = await api.getEpisodio(req);
    res.json(result);
  } catch (error) {
    console.error('[AnimeFire] getEpisodio error:', error);
    res.status(500).json({ error: 'Failed to fetch data from AnimeFire' });
  }
});

app.get('/api/animefire/extractVideo', async (req, res) => {
  try {
    const api = await getApiFireAnime();
    const result = await api.extractVideo(req);
    res.json(result);
  } catch (error) {
    console.error('[AnimeFire] extractVideo error:', error);
    res.status(500).json({ error: 'Failed to fetch data from AnimeFire' });
  }
});

app.get('/proxy-video', async (req, res) => {
  try {
    const { videoUrl, episodeUrl } = req.query;
    if (!videoUrl) {
      return res.status(400).json({ error: 'URL do video é obrigatória' });
    }
    console.log('🎬 Proxy para video:', videoUrl);

    const range = req.headers.range;
    if (range) {
      console.log('📡 Range request:', range);
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
          console.log('🍪 Cookies obtidos:', cookies);
        }
      } catch (error: any) {
        console.error('Erro ao obter cookies:', error.message);
      }
    }

    const videoHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': (episodeUrl as string) || 'https://animefire.io/',
      'Cookie': cookies
    };

    if (range) {
      videoHeaders['Range'] = range;
    }

    const videoResponse = await axios.get(videoUrl as string, {
      headers: videoHeaders,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', String(videoResponse.headers['content-type'] || 'video/mp4'));
    res.setHeader('Content-Disposition', 'inline; filename="video.mp4"');
    res.setHeader('Accept-Ranges', 'bytes');

    if (videoResponse.headers['content-range']) {
      res.setHeader('Content-Range', String(videoResponse.headers['content-range']));
      res.setHeader('Content-Length', String(videoResponse.headers['content-length'] || ''));
      res.status(206);
      console.log('📀 Streaming parcial (206):', videoResponse.headers['content-range']);
    } else {
      res.setHeader('Content-Length', String(videoResponse.headers['content-length'] || ''));
      res.status(200);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range');

    videoResponse.data.pipe(res);

  } catch (error: any) {
    console.error('❌ Erro no proxy de video:', error.message);
    res.status(500).json({ error: 'Erro ao acessar video via proxy' });
  }
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}

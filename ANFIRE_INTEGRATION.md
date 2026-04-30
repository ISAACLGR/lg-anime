# AnFireAPI Integration Guide

## Overview

O AnimeFire Client integra com a **AnFireAPI** para extrair links de vídeo dos episódios do AnimeFire (https://animefire.plus).

## Arquitetura

### 1. Cliente AnFireAPI (`lib/api/anfire-api-client.ts`)

Responsável por:
- Converter slugs do Jikan para slugs do AnimeFire
- Construir URLs dos episódios
- Fazer web scraping para extrair links de vídeo
- Suportar múltiplas fontes de vídeo (qualidades diferentes)

### 2. Hook useAnFireVideos (`lib/hooks/use-anfire-videos.ts`)

Gerencia:
- Busca de vídeos com cache em AsyncStorage
- Seleção de fonte de vídeo
- Tratamento de erros
- Limpeza de cache

### 3. Player Screen (`app/player/[slug].tsx`)

Implementa:
- Reprodução de vídeo com expo-video
- Seleção de qualidade
- Fallback para vídeo de demonstração se AnFireAPI falhar
- Integração com Google Ads (anúncios antes de episódios)

## Como Funciona

### Fluxo de Extração de Vídeo

```
1. Usuário clica em "Assistir Agora" na tela de detalhes
   ↓
2. Player Screen é carregado com slug do anime e número do episódio
   ↓
3. useAnFireVideos.fetchEpisodeVideo() é chamado
   ↓
4. Converte slug Jikan para slug AnimeFire
   ↓
5. Verifica cache em AsyncStorage
   ↓
6. Se não estiver em cache:
   - Faz request para https://animefire.plus/video/{slug}/{episode}
   - Faz web scraping do HTML
   - Extrai links de vídeo (iframes, downloads diretos, scripts)
   - Cacheia resultado
   ↓
7. Retorna array de VideoSource com URLs e qualidades
   ↓
8. Player exibe opções de qualidade
   ↓
9. Usuário seleciona qualidade e reproduz vídeo
```

### Padrões de Extração

O cliente procura por vídeos em três padrões:

1. **iframes de vídeo**: `<iframe src="...">`
2. **Links de download**: `<a href="*.mp4|*.mkv|*.webm">`
3. **Scripts com URLs**: URLs em arquivos JavaScript

## Limitações e Considerações

### CORS (Cross-Origin Resource Sharing)

O web scraping direto do navegador pode ter problemas de CORS. Soluções:

1. **Usar proxy CORS público** (implementado):
   ```typescript
   buildProxiedUrl(url) // usa api.allorigins.win
   ```

2. **Backend próprio** (recomendado para produção):
   ```typescript
   // Criar endpoint em seu backend
   GET /api/proxy?url=https://animefire.plus/video/...
   ```

3. **Usar AnFireAPI oficial** (se disponível):
   - Verificar se existe API pública do AnFireAPI
   - Usar endpoints oficiais em vez de web scraping

### Performance

- **Cache em AsyncStorage**: Armazena últimos 50 vídeos
- **Delay entre requisições**: 500ms para não sobrecarregar servidor
- **Timeout**: Parar após 5 episódios sem sucesso

### Qualidade de Vídeo

O cliente extrai automaticamente a qualidade:
- 1080p
- 720p
- 480p
- 360p

## Configuração

### Variáveis de Ambiente

Nenhuma variável de ambiente obrigatória. O cliente funciona sem configuração.

### Dependências

```json
{
  "axios": "^1.13.2",
  "cheerio": "^1.0.0-rc.12" // Para parsing HTML (se usar Node.js backend)
}
```

## Uso

### Básico

```typescript
import { useAnFireVideos } from "@/lib/hooks/use-anfire-videos";

export function MyComponent() {
  const { fetchEpisodeVideo, videoUrl, videoSources } = useAnFireVideos();

  useEffect(() => {
    // Buscar vídeo do episódio 1 de Naruto
    fetchEpisodeVideo("naruto", 1);
  }, []);

  return (
    <View>
      <Text>URL do vídeo: {videoUrl}</Text>
      <Text>Fontes disponíveis: {videoSources.length}</Text>
    </View>
  );
}
```

### Com Tratamento de Erro

```typescript
const handlePlayEpisode = async (animeSlug: string, episodeNum: number) => {
  try {
    const video = await fetchEpisodeVideo(animeSlug, episodeNum);
    if (video) {
      // Reproduzir vídeo
      playVideo(video.sources[0].url);
    }
  } catch (error) {
    // Usar fallback ou mostrar erro
    showError("Vídeo não disponível");
  }
};
```

## Troubleshooting

### Problema: "Nenhuma fonte de vídeo encontrada"

**Causas possíveis:**
- Anime não existe no AnimeFire
- Episódio não foi lançado ainda
- Estrutura HTML do AnimeFire mudou

**Solução:**
- Verificar se o anime existe em https://animefire.plus/
- Verificar se o episódio está disponível
- Atualizar padrões de extração se HTML mudou

### Problema: CORS error

**Causa:**
- Navegador bloqueou requisição cross-origin

**Solução:**
- Usar proxy CORS (já implementado)
- Ou criar backend próprio para fazer scraping

### Problema: Vídeo não reproduz

**Causas possíveis:**
- URL do vídeo expirou
- Servidor de vídeo está offline
- Formato de vídeo não suportado

**Solução:**
- Tentar outra fonte de vídeo
- Limpar cache e tentar novamente
- Usar fallback video

## Melhorias Futuras

1. **API Oficial**: Integrar com API oficial do AnFireAPI se disponível
2. **Múltiplos Provedores**: Suportar outras fontes (GogoAnime, 9anime, etc.)
3. **Download de Episódios**: Permitir download para assistir offline
4. **Legendas**: Extrair e exibir legendas
5. **Histórico de Assistência**: Rastrear progresso do episódio
6. **Recomendações**: Sugerir próximos episódios baseado no histórico

## Referências

- [AnFireAPI GitHub](https://github.com/MestreTM/AnFireAPI-Anime-Player)
- [AnimeFire](https://animefire.plus/)
- [Cheerio Documentation](https://cheerio.js.org/)
- [Axios Documentation](https://axios-http.com/)

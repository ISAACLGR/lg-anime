# SugoiAPI Documentation

## Overview

A SugoiAPI é uma API aberta em PHP que fornece links de episódios de animes de diferentes provedores (providers). A API não hospeda conteúdo, apenas redireciona para sites de terceiros.

**Repository:** https://github.com/yzPeedro/SugoiAPI

---

## Setup Local

```bash
git clone https://github.com/yzPeedro/SugoiAPI.git sugoiapi
cd sugoiapi
docker compose up -d
```

A API estará disponível em `http://localhost` (ou porta configurada no docker-compose.yml).

---

## Endpoints

### Get Episode Links

**Endpoint:**
```
GET /episode/:anime-slug/:temporada/:numero-episodio
```

**Parameters:**
- `anime-slug` (string): Slug do anime (ex: "naruto", "bleach")
- `temporada` (integer): Número da temporada (ex: 1, 2, 3)
- `numero-episodio` (integer): Número do episódio (ex: 1, 2, 3)

**Example Request:**
```
GET /episode/naruto/1/1
```

**Success Response (200):**
```json
{
  "error": false,
  "message": "Success",
  "status": 200,
  "data": [
    {
      "name": "Anime Fire",
      "slug": "anime-fire",
      "has_ads": false,
      "is_embed": false,
      "episodes": [
        {
          "error": false,
          "searched_endpoint": "https://animefire.plus/video/naruto/1",
          "episode": "https://lightspeedst.net/s3/mp4/naruto/sd/1.mp4"
        }
      ]
    }
  ]
}
```

**Error Response (404):**
```json
{
  "error": true,
  "message": "Not Found",
  "status": 404
}
```

---

## Response Structure

### Success Response

| Field | Type | Description |
|-------|------|-------------|
| `error` | boolean | Indica se houve erro (false = sucesso) |
| `message` | string | Mensagem descritiva ("Success", "Not Found", etc.) |
| `status` | integer | Código HTTP (200, 404, etc.) |
| `data` | array | Array de providers com episódios |

### Provider Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Nome do provider (ex: "Anime Fire") |
| `slug` | string | Slug do provider (ex: "anime-fire") |
| `has_ads` | boolean | Se o provider tem anúncios |
| `is_embed` | boolean | Se é um embed (iframe) ou link direto |
| `episodes` | array | Array de episódios encontrados |

### Episode Object

| Field | Type | Description |
|-------|------|-------------|
| `error` | boolean | Se houve erro ao buscar este episódio |
| `searched_endpoint` | string | URL do provider onde foi buscado |
| `episode` | string | URL do vídeo (link direto ou embed) |

---

## HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Episódio encontrado com sucesso |
| 404 | Not Found | Episódio não encontrado em nenhum provider |
| 500 | Server Error | Erro interno do servidor |

---

## Providers Supported

A SugoiAPI suporta múltiplos providers. Cada provider pode ter diferentes regras de requisição:

- **Anime Fire** - Provider principal, sem anúncios
- Outros providers podem ser adicionados conforme disponibilidade

**Nota:** Consulte a documentação de providers no repositório para detalhes específicos de cada um.

---

## Limitations & Notes

1. **Sem Busca Global:** A API atual não possui endpoint de busca de animes. É necessário conhecer o slug do anime.
2. **Sem Listagem:** Não há endpoint para listar todos os animes disponíveis.
3. **Rate Limiting:** Não há informações sobre rate limiting. Use com moderação.
4. **CORS:** Verificar se a API permite CORS para requisições do navegador/mobile.
5. **Slugs:** Os slugs dos animes devem ser obtidos do AnimeFire ou através de web scraping.

---

## Integration Strategy for AnimeFire Client

### Phase 1: Anime Discovery
Para descobrir animes, será necessário:
1. Fazer web scraping do AnimeFire (https://animefire.io/) para obter lista de animes e seus slugs
2. Armazenar em cache local (AsyncStorage ou banco de dados)
3. Permitir busca e filtro por gênero

### Phase 2: Episode Fetching
1. Quando usuário seleciona um anime, buscar episódios via SugoiAPI
2. Usar slug do anime + número de temporada + número de episódio
3. Retornar primeiro link disponível (preferir providers sem anúncios)

### Phase 3: Video Playback
1. Usar URL retornada pela API no player (expo-video)
2. Implementar fallback se um provider falhar
3. Salvar progresso localmente

---

## Example Implementation (React/Expo)

```typescript
// api/sugoiapi.ts
const SUGOIAPI_BASE = "http://localhost"; // ou URL hospedada

export async function getEpisodeLinks(
  animeSlug: string,
  season: number,
  episode: number
) {
  try {
    const response = await fetch(
      `${SUGOIAPI_BASE}/episode/${animeSlug}/${season}/${episode}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message);
    }
    
    // Retornar primeiro link disponível
    if (data.data && data.data.length > 0) {
      const provider = data.data[0];
      if (provider.episodes && provider.episodes.length > 0) {
        return provider.episodes[0].episode;
      }
    }
    
    throw new Error("No episodes found");
  } catch (error) {
    console.error("Error fetching episode:", error);
    throw error;
  }
}
```

---

## Disclaimer

Este projeto não incentiva pirataria. A API apenas redireciona para sites de terceiros. Se você gosta do anime, considere apoiar o criador comprando o produto original.

Para remover links ou reportar problemas, contate: pedrocruzpessoa16@gmail.com


# Cache em Arquivo para ScraperAPI

## Visão Geral
Sistema de cache em arquivo (JSON) para armazenar resultados de acessos à API ScraperAPI, reduzindo chamadas repetidas e economizando recursos. **Sem dependências nativas!**

## Configuração

### Variável de Ambiente
```env
# TTL em milissegundos (padrão: 2 horas = 7200000ms)
CACHE_TTL_MS=7200000
```

### Valores Comuns
- 1 hora: `3600000`
- 2 horas: `7200000` (padrão)
- 4 horas: `14400000`
- 24 horas: `86400000`

## Arquivos Modificados/Criados

### 1. `lib/api/animeFire/file-cache.js` (NOVO)
Módulo de cache em arquivo com:
- TTL parametrizável via construtor ou env
- Auto-limpeza a cada 10 minutos
- Métodos: `get()`, `set()`, `has()`, `delete()`, `cleanup()`, `clear()`, `stats()`
- **Sem dependências externas** - usa apenas Node.js fs

### 2. `lib/api/animeFire/cliente-anime-fire.js`
- Integração com FileCache
- Cache em `fetchAnimesFromPage()`
- Método `extractAnimesFromHtml()` para reuso
- `getCacheStats()` e `clearCache()` assíncronos

### 3. `lib/api/animeFire/extract-video.js`
- Cache em `fetchWithScraper()`
- Constructor inicializando FileCache

### 4. `lib/api/animeFire/list-episodios-animes.js`
- Cache em `fetchAnimePage()`
- Constructor inicializando FileCache

### 5. `lib/api/animeFire/server.js`
- Endpoints `/filter-service/stats` e `/filter-service/clear-cache` assíncronos

## Endpoints

### Estatísticas do Cache
```
GET /filter-service/stats
```
Retorna:
```json
{
  "success": true,
  "cache": {
    "size": 10,
    "timeout": 1800,
    "scraperCache": {
      "total": 25,
      "valid": 20,
      "expired": 5,
      "totalSize": 153600,
      "ttlMs": 7200000,
      "cacheDir": ".../data/cache"
    }
  }
}
```

### Limpar Cache
```
POST /filter-service/clear-cache
```

## Instalação
**Nenhuma dependência adicional necessária!** O FileCache usa apenas módulos nativos do Node.js.

## Local do Cache
```
./data/cache/
```
Arquivos JSON com hash MD5 como nome.

## Logs
O cache gera logs no console:
- `? Cache HIT: {key}` - Dados retornados do cache
- `? Cache SET: {key}` - Dados salvos no cache
- `? FileCache cleanup: X entradas removidas` - Limpeza automática
- `? FileCache inicializado` - Inicialização

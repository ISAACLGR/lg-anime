# Configuração do Google Drive Cache

## Visão Geral

Este projeto agora suporta cache no Google Drive como alternativa ao cache local. Isso permite persistência de cache entre diferentes servidores e ambientes.

## Pré-requisitos

1. **Node.js** instalado
2. **Conta Google** com acesso ao Google Drive
3. **Projeto no Google Cloud Console**

## Passo 1: Criar Projeto Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o **ID do Projeto**

## Passo 2: Habilitar Google Drive API

1. No console, vá para **APIs & Services** ? **Library**
2. Procure por **Google Drive API**
3. Clique em **Enable**

## Passo 3: Criar Service Account

1. Vá para **APIs & Services** ? **Credentials**
2. Clique em **+ CREATE CREDENTIALS** ? **Service Account**
3. Preencha:
   - **Service account name**: `animefire-cache`
   - **Service account ID**: `animefire-cache@seu-projeto.iam.gserviceaccount.com`
   - **Description**: `Cache service for AnimeFire API`
4. Clique em **CREATE AND CONTINUE**
5. Pule a etapa de permissões por agora
6. Clique em **DONE**

## Passo 4: Gerar Chave JSON

1. Na lista de Service Accounts, clique no criado
2. Vá para **KEYS** tab
3. Clique em **ADD KEY** ? **Create new key**
4. Selecione **JSON**
5. Clique em **CREATE**
6. O arquivo JSON será baixado automaticamente
7. **Renomeie** para `credentials.json`
8. **Mova** para a raiz do projeto

## Passo 5: Compartilhar Pasta do Google Drive

1. Acesse [Google Drive](https://drive.google.com/)
2. Crie uma nova pasta chamada `animefire-cache`
3. Clique com o botão direito na pasta
4. Selecione **Compartilhar**
5. Adicione o email do Service Account: `animefire-cache@seu-projeto.iam.gserviceaccount.com`
6. Dê permissão **Editor**
7. Clique em **Enviar**

## Passo 6: Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```env
# Google Drive Configuration
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_CREDENTIALS_PATH=./credentials.json
GOOGLE_DRIVE_CACHE_FOLDER=animefire-cache
```

## Passo 7: Testar Configuração

1. Instale as dependências:
   ```bash
   npm install googleapis@105
   ```

2. Configure o `.env`:
   ```bash
   cp .env.example .env
   # Edite o .env com suas configurações
   ```

3. Inicie o servidor:
   ```bash
   npm run dev
   ```

4. Verifique os logs:
   ```
   ? GoogleDriveCache inicializado (TTL: 7200000ms, Folder: animefire-cache)
   ? Pasta de cache encontrada: animefire-cache (1a2b3c4d5e)
   ```

## Estrutura do Cache

O cache será armazenado como arquivos JSON na pasta do Google Drive:

```
animefire-cache/
??? 0c8ef23f0693b81096f9f89fbbd15ba9.json
??? 185c3fa345b831f1ca9aa29a99d91a81.json
??? ...
```

Cada arquivo contém:
```json
{
  "key": "scraper:https://animefire.io/animes/nome-do-anime",
  "url": "https://api.scraperapi.com/?api_key=...",
  "data": { ... },
  "original_url": "https://animefire.io/animes/nome-do-anime",
  "created_at": 1704873600000,
  "expires_at": 1704880800000
}
```

## Funcionalidades

### ? Recursos Suportados
- `get()` - Recuperar cache
- `set()` - Salvar cache
- `has()` - Verificar existência
- `delete()` - Remover item específico
- `cleanup()` - Remover itens expirados
- `clear()` - Limpar todo o cache
- `stats()` - Estatísticas do cache

### ? Fallback Automático
Se o Google Drive falhar, o sistema automaticamente usa o cache local:

```
? Erro ao inicializar GoogleDriveCache: ...
? Usando fallback para cache local...
```

## Segurança

### ? Práticas Recomendadas
1. **Nunca** commitar o `credentials.json`
2. **Sempre** usar `.env` para configurações sensíveis
3. **Limitar** permissões do Service Account ao necessário
4. **Monitorar** uso da API do Google Drive

### ? Permissões Necessárias
O Service Account precisa apenas de:
- `https://www.googleapis.com/auth/drive.file`
- Acesso à pasta específica (não ao Drive inteiro)

## Monitoramento

### Logs do Sistema
```
? GoogleDriveCache inicializado
? Cache HIT: scraper:https://animefire.io/...
? Cache SET: scraper:https://animefire.io/...
? GoogleDriveCache cleanup: 5 entradas removidas
```

### Estatísticas
```javascript
const stats = await fileCache.stats();
console.log(stats);
// {
//   total: 25,
//   valid: 20,
//   expired: 5,
//   totalSize: 1048576,
//   ttlMs: 7200000,
//   cacheFolder: 'animefire-cache',
//   folderId: '1a2b3c4d5e'
// }
```

## Troubleshooting

### ? Erros Comuns

**"Cannot find module 'googleapis'"**
```bash
npm install googleapis@105
```

**"Invalid service account credentials"**
- Verifique se o `credentials.json` está na pasta correta
- Confirme o caminho em `GOOGLE_DRIVE_CREDENTIALS_PATH`

**"Insufficient permissions"**
- Verifique se o Service Account tem permissão de Editor na pasta
- Confirme se a API Drive está habilitada

**"Folder not found"**
- Verifique o nome da pasta em `GOOGLE_DRIVE_CACHE_FOLDER`
- Confirme se a pasta foi compartilhada com o Service Account

### ? Debug Mode

Para debug, adicione ao `.env`:
```env
DEBUG=google-drive-cache
```

## Alternativas

Se o Google Drive não for adequado, considere:

1. **Redis** - Cache em memória distribuído
2. **AWS S3** - Storage em nuvem
3. **MongoDB** - Database com TTL
4. **Cache local** - Opção padrão atual

## Performance

### ? Benchmarks
- **Leitura**: ~200-500ms (depende da conexão)
- **Escrita**: ~300-600ms (depende do tamanho)
- **Listagem**: ~100-300ms
- **Cleanup**: ~1-3s (para muitos arquivos)

### ? Recomendações
- **TTL**: 2-4 horas para balancear frescor e performance
- **Cleanup**: Automático a cada 10 minutos
- **Batch size**: Processar em lotes para muitas operações

## Custos

### ? Google Drive API
- **Gratuito**: Até 100 requisições/dia
- **Pago**: $0.20 por 1.000 requisições adicionais
- **Storage**: 15GB gratuitos

### ? Estimativa de Uso
- **Leve**: ~50 requisições/dia (gratuito)
- **Moderado**: ~500 requisições/dia (~$0.10/dia)
- **Pesado**: ~5.000 requisições/dia (~$1.00/dia)

---

## Suporte

Para dúvidias ou problemas:
1. Verifique os logs do sistema
2. Consulte o troubleshooting acima
3. Abra uma issue no repositório

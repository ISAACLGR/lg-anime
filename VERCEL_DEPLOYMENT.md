# Deploy no Vercel

## Configuração de Variáveis de Ambiente

No painel do Vercel → Settings → Environment Variables, configure as seguintes variáveis:

### Banco de Dados
- `DATABASE_URL` - String de conexão do PostgreSQL (Neon/Railway/PlanetScale)
  - Exemplo PostgreSQL (Neon): `postgresql://user:password@ep-cool-name.us-east-2.aws.neon.tech/neondb?sslmode=require`
  - Exemplo MySQL (PlanetScale): `mysql://user:password@aws.connect.psdb.cloud/animefire`

### API Configuration
- `EXPO_PUBLIC_API_URL` - URL do backend no Vercel
  - Exemplo: `https://seu-backend.vercel.app`
  - **Importante**: Use a URL real do Vercel após o deploy

### ScraperAPI
- `SCRAPERAPI_KEY` - Sua chave do ScraperAPI
- `SCRAPERAPI_URL` - `https://api.scraperapi.com`
- `SCRAPERAPI_DEVICE_TYPE` - `desktop`
- `SCRAPERAPI_COUNTRY_CODE` - `br`

### Cache
- `CACHE_ENABLED` - `true`
- `CACHE_TTL_MS` - `7200000` (2 horas em milissegundos)

### OAuth
- `OAUTH_SERVER_URL` - URL do servidor OAuth (se aplicável)
- `VERCEL_OIDC_TOKEN` - Token OIDC do Vercel (se aplicável)

### Firebase (se usado)
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

### Outros
- `NODE_ENV` - `production` (automático no Vercel)
- `IS_LOCAL` - `false`

## Passos para Deploy

1. **Instalar Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login no Vercel**
   ```bash
   vercel login
   ```

3. **Deploy do Backend**
   ```bash
   vercel
   ```

4. **Configurar variáveis de ambiente** no painel do Vercel

5. **Redeploy** após configurar as variáveis
   ```bash
   vercel --prod
   ```

## Notas Importantes

- O arquivo `vercel.json` já está configurado para o Vercel
- A porta é definida automaticamente pelo Vercel via `process.env.PORT`
- O script `build:vercel` foi adicionado ao package.json
- O backend usa `process.env.PORT || "3000"` para compatibilidade com Vercel

## Banco de Dados Recomendado

Para hospedagem gratuita, recomendo:
- **Neon** (PostgreSQL serverless gratuito)
- **PlanetScale** (MySQL serverless gratuito)
- **Railway** (PostgreSQL com $5 de crédito/mês)

Se usar MySQL (PlanetScale), mantenha a configuração atual. Se usar PostgreSQL (Neon/Railway), precisará migrar o schema do Drizzle ORM.

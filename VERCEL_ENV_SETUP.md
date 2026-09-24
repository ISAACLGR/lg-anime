# Variáveis de Ambiente para Vercel

Configure estas variáveis no painel do Vercel: https://vercel.com/reneduartes-projects/lg-anime/settings/environment-variables

## Variáveis Necessárias

### Banco de Dados
- `DATABASE_URL` - String de conexão do MySQL/PostgreSQL
  - Exemplo MySQL (PlanetScale): `mysql://user:password@aws.connect.psdb.cloud/animefire`
  - Exemplo PostgreSQL (Neon): `postgresql://user:password@ep-cool-name.us-east-2.aws.neon.tech/neondb?sslmode=require`

### ScraperAPI
- `SCRAPERAPI_KEY` = `08d973cbf0af4a48f4f5dbb373475b9d`
- `SCRAPERAPI_URL` = `https://api.scraperapi.com`
- `SCRAPERAPI_DEVICE_TYPE` = `desktop`
- `SCRAPERAPI_COUNTRY_CODE` = `br`

### Cache Configuration
- `CACHE_ENABLED` = `true`
- `CACHE_TTL_MS` = `7200000`
- `USE_SCRAPERAPI` = `false`

### Frontend Configuration
- `EXPO_PUBLIC_API_URL` = URL do projeto no Vercel (ex: `https://lg-anime.vercel.app`)
- `EXPO_PORT` = `8082`

### OAuth
- `OAUTH_SERVER_URL` = URL do servidor OAuth (se aplicável)

### Firebase
- `EXPO_PUBLIC_FIREBASE_API_KEY` = `AIzaSyBXsFPxfEUTE3_hrfe_MJQk3ZB5ZWUERsc`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` = `login-172916.firebaseapp.com`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID` = `login-172916`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` = `login-172916.firebasestorage.app`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `956400679808`
- `EXPO_PUBLIC_FIREBASE_APP_ID` = `1:956400679808:web:d469e80500b12fe8de1f65`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` = (vazio)
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = `956400679808-dm4l3cb9278cgv2md87dc38ivonpk9vs.apps.googleusercontent.com`

### Outros
- `IS_LOCAL` = `false`
- `NODE_ENV` = `production` (automático no Vercel)

## Passos para Configurar

1. Acesse: https://vercel.com/reneduartes-projects/lg-anime/settings/environment-variables
2. Clique em "Add New"
3. Adicione cada variável com seu valor correspondente
4. Selecione os ambientes (Production, Preview, Development)
5. Clique em "Save"

## Importante

- `EXPO_PUBLIC_API_URL` deve ser atualizado após o primeiro deploy para usar a URL real do Vercel
- Para banco de dados gratuito, recomendo:
  - **PlanetScale** (MySQL): https://planetscale.com
  - **Neon** (PostgreSQL): https://neon.tech

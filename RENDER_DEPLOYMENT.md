# Deploy no Render (Backend) via Bitbucket

**Vantagens:** Plano gratuito sem cartão de crédito, aceita Bitbucket nativamente

## Passo 1: Criar conta no Render

1. Acesse https://render.com
2. Clique em "Sign Up" e faça login com sua conta **Bitbucket**
3. **Não pede cartão de crédito** para plano gratuito

## Passo 2: Criar Web Service para Backend

1. Clique em "New +" → "Web Service"
2. Selecione o repositório `lg-anime` do Bitbucket
3. Render detectará automaticamente Node.js

## Passo 3: Configurar Build Settings

- **Build Command**: `pnpm install && pnpm run build`
- **Start Command**: `pnpm start`

## Passo 4: Configurar variáveis de ambiente

No painel do Render, vá em "Environment" e adicione:

```
DATABASE_URL=mysql://user:password@localhost:3306/animefire
SCRAPERAPI_KEY=08d973cbf0af4a48f4f5dbb373475b9d
SCRAPERAPI_URL=https://api.scraperapi.com
SCRAPERAPI_DEVICE_TYPE=desktop
SCRAPERAPI_COUNTRY_CODE=br
CACHE_TTL_MS=7200000
IS_LOCAL=false
NODE_ENV=production
PORT=3000
```

## Passo 5: Banco de Dados

Use PlanetScale (MySQL grátis) ou Neon (PostgreSQL grátis):

**PlanetScale (MySQL):**
1. Acesse https://planetscale.com
2. Crie conta gratuita (sem cartão)
3. Crie banco de dados
4. Copie a `DATABASE_URL` fornecida
5. Configure no Render

**Neon (PostgreSQL):**
1. Acesse https://neon.tech
2. Crie conta gratuita (sem cartão)
3. Crie banco de dados
4. Copie a `DATABASE_URL` fornecida
5. Configure no Render (precisa migrar schema do Drizzle)

## Passo 6: Deploy automático

Render fará deploy automático. A URL será algo como:
`https://lg-anime-backend.onrender.com`

## Passo 7: Frontend Web (Netlify)

Para o frontend web, use Netlify (grátis, sem cartão):

1. Acesse https://netlify.com
2. Conecte repositório Bitbucket
3. Build command: `pnpm install && pnpm run build:web`
4. Publish directory: `dist`
5. Configure `EXPO_PUBLIC_API_URL` com a URL do Render

## Notas Importantes

- **Render**: Plano gratuito sem cartão, sleep após 15min inatividade
- **Netlify**: Plano gratuito sem cartão, 100GB bandwidth/mês
- **PlanetScale/Neon**: Planos gratuitos sem cartão
- Ambos aceitam Bitbucket nativamente

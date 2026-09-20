# Deploy no Render via Bitbucket

## Passo 1: Criar conta no Render

1. Acesse https://render.com
2. Clique em "Sign Up" e faça login com sua conta **Bitbucket**

## Passo 2: Criar novo Web Service

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

## Passo 5: Configurar banco de dados (opcional)

Se quiser usar banco de dados no Render:

1. Clique em "New +" → "PostgreSQL"
2. Render fornecerá a `DATABASE_URL` correta
3. Atualize a variável de ambiente com a URL fornecida
4. **Nota**: Render oferece PostgreSQL grátis, então você precisaria migrar de MySQL para PostgreSQL

## Passo 6: Deploy automático

Render fará deploy automático sempre que você fizer push no Bitbucket.

## Passo 7: Obter a URL

Após o deploy, Render fornecerá uma URL como:
`https://seu-produto.onrender.com`

## Notas Importantes

- O plano gratuito do Render inclui:
  - Web Service gratuito (com sleep após 15min inatividade)
  - PostgreSQL gratuito
- O serviço pode "dormir" após inatividade no plano gratuito
- Render aceita Bitbucket nativamente, sem necessidade de migração

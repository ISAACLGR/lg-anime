# Deploy no Railway via GitHub

## Passo 1: Preparar o repositório

Certifique-se de que seu projeto está no GitHub e o arquivo `server/_core/index.ts` está configurado para exportar o app Express.

## Passo 2: Criar conta no Railway

1. Acesse https://railway.app
2. Clique em "Login" e faça login com sua conta GitHub

## Passo 3: Criar novo projeto

1. Clique em "New Project" → "Deploy from GitHub repo"
2. Selecione o repositório `lg-anime`
3. Railway detectará automaticamente Node.js

## Passo 4: Configurar variáveis de ambiente

No painel do Railway, vá em "Variables" e adicione:

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

Se quiser usar banco de dados no Railway:

1. Clique em "New" → "Database"
2. Escolha MySQL ou PostgreSQL
3. Railway fornecerá a `DATABASE_URL` correta
4. Atualize a variável de ambiente com a URL fornecida

## Passo 6: Deploy automático

Railway fará deploy automático sempre que você fizer push no GitHub.

## Passo 7: Obter a URL

Após o deploy, Railway fornecerá uma URL como:
`https://seu-produto.railway.app`

## Notas Importantes

- O plano gratuito do Railway inclui $5 de crédito/mês
- O serviço pode "dormir" após inatividade no plano gratuito
- Para MySQL, você pode usar um banco externo como PlanetScale (grátis)
- Para PostgreSQL, o Railway oferece banco grátis integrado

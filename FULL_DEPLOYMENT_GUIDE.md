# Deploy Completo: Backend + Frontend

## Backend (Node.js/Express) - Render

### Passo 1: Criar conta no Render
1. Acesse https://render.com
2. Clique em "Sign Up" e faça login com sua conta **Bitbucket**

### Passo 2: Criar Web Service para Backend
1. Clique em "New +" → "Web Service"
2. Selecione o repositório `lg-anime` do Bitbucket
3. Render detectará automaticamente Node.js

### Passo 3: Configurar Build Settings
- **Build Command**: `pnpm install && pnpm run build`
- **Start Command**: `pnpm start`

### Passo 4: Configurar variáveis de ambiente
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

### Passo 5: Deploy automático
Render fará deploy automático após configurar. A URL será algo como:
`https://seu-backend.onrender.com`

---

## Frontend Web (Expo) - Netlify

### Passo 1: Criar conta no Netlify
1. Acesse https://netlify.com
2. Clique em "Sign up" e faça login com sua conta **Bitbucket**

### Passo 2: Criar novo site
1. Clique em "Add new site" → "Import an existing project"
2. Selecione o repositório `lg-anime` do Bitbucket

### Passo 3: Configurar Build Settings
- **Build command**: `pnpm install && pnpm run build:web`
- **Publish directory**: `dist/web`

### Passo 4: Configurar variáveis de ambiente
No painel do Netlify, vá em "Site settings" → "Environment variables" e adicione:

```
EXPO_PUBLIC_API_URL=https://seu-backend.onrender.com
```

### Passo 5: Deploy automático
Netlify fará deploy automático após configurar. A URL será algo como:
`https://seu-frontend.netlify.app`

---

## Frontend Mobile (Expo)

### Desenvolvimento com Expo Go (Grátis)

1. Instale o app Expo Go no seu celular (Android/iOS)
2. No projeto, execute:
   ```bash
   npx expo start
   ```
3. Escaneie o QR code com o app Expo Go
4. O app será carregado no seu celular

### Build de Produção (Opcional)

Para gerar APK/IPA, use o EAS Build (precisa resolver erros de dependências primeiro):
```bash
npx eas-cli@latest build --platform android
```

---

## Resumo

| Serviço | Plataforma | Plano | URL Exemplo |
|---------|-----------|-------|-------------|
| Backend | Render | Grátis | https://lg-anime-backend.onrender.com |
| Frontend Web | Netlify | Grátis | https://lg-anime-frontend.netlify.app |
| Frontend Mobile | Expo Go | Grátis | Via QR code |

## Notas Importantes

- Render e Netlify aceitam Bitbucket nativamente
- Ambos têm planos gratuitos
- O backend pode "dormir" após inatividade no plano gratuito
- Para produção mobile, considere resolver os erros de dependências do EAS Build

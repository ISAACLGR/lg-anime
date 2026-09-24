Checklist e plano passo-a-passo para deploy no Vercel

Objetivo: Deployar o frontend (web) e o backend (API) gerados pelo monorepo `lg-anime` no Vercel, verificando build, rotas e variáveis de ambiente.

Status: use a seção "Progresso" no final do arquivo para marcar cada passo.

SUMÁRIO RÁPIDO
- Build command (Vercel): `pnpm run build:all`
- Output directory (Vercel): `dist`
- Start script (produção local): `node dist/api/index.js`
- Observação importante: a rota `/proxy-video` faz proxy e usa streaming/Range — serverless (funções Vercel) pode ter limitações. Se a aplicação depender de streaming estável, recomendo deploy do backend em Render/Fly com o `Dockerfile`.

PREREQUISITOS LOCAIS
1. Tenha o Node.js (recomendado LTS) e `pnpm` instalados.
2. No repositório local, rode:

```powershell
cd C:\projetoAnimes\lg-anime
pnpm install
```

3. Verifique se você tem `dist` pronto (web + api). Gerar localmente para testar antes de enviar ao Vercel:

```powershell
# Gera o bundle da API (esbuild) e o web export do Expo
pnpm run build:vercel   # cria dist/api
pnpm run build:web      # cria dist (web)
# ou apenas
pnpm run build:all      # faz ambos (recomendado)
```

Verifique existência do bundle da API:

```powershell
Test-Path .\dist\api\index.js
# ou
Get-ChildItem .\dist\api
```

Se `dist\api\index.js` não existir, revise logs do `pnpm run build:vercel`.

ROTEIRO DE CONFIGURAÇÃO NO VERCEL
1. No dashboard do Vercel, clique em "New Project" → selecione o repositório `lg-anime`.
2. Em Settings do projeto (Build & Output):
   - Build Command: `pnpm run build:all`
   - Install Command: `pnpm install`
   - Output Directory: `dist`
   - Framework Preset: `Other` (ou deixe em auto se Vercel detectar corretamente)
3. Environment Variables (adicionar no Vercel > Settings > Environment Variables):
   - `IS_LOCAL` = `false`
   - `USE_SCRAPERAPI` = `false` (ou `true` se você usar ScraperAPI)
   - `EXPO_PUBLIC_API_BASE_URL` = `https://<sua-domain-ou-vercel-url>` (opcional — define onde o frontend chama a API)
   - Se usar DB remoto: `DATABASE_URL` = `<sua-database-url>` (se migrar para Postgres/Supabase). NOTE: Drizzle config atualmente usa `mysql` dialect no `drizzle.config.ts` — ajuste se usar Postgres.

4. Rewrites / Routes já presentes em `vercel.json`:
   - `/api/:path*` -> `/api/index.js`
   - `/proxy-video` -> `/api/index.js`
   - `/(.*)` -> `/$1`
   Vercel costuma aplicar `vercel.json` automaticamente ao detectar o arquivo.

FAZENDO O DEPLOY
- Puxe a branch desejada (ex: `main`) e faça push. Vercel automaticamente iniciará build.
- Acompanhe o log de build no Vercel Dashboard (botão `Logs`) e corrija erros locais antes de re-deployar.

VERIFICAÇÃO / TESTES PÓS-DEPLOY
1. Acesse a URL fornecida (ex: `https://lg-anime.vercel.app`).
2. Teste a rota de saúde da API:

```powershell
# usando PowerShell/curl:
Invoke-WebRequest -UseBasicParsing https://<projeto>.vercel.app/api/health
# ou curl:
curl https://<projeto>.vercel.app/api/health
```
Resposta esperada: JSON contendo `{ ok: true }` (ou similar).

3. Teste rotas da API que o frontend usa (ex: `/api/animefire/em-lancamento/1`) e verifique console e network do navegador.
4. Teste streaming/proxy de vídeo (abrir episódio no player). Se o vídeo não carregar corretamente, verifique logs do Vercel — problema comum: Range/streaming não funciona bem em serverless. Nesse caso, mover backend para Render/Fly com `Dockerfile` é a solução.

LOGS E DEBUG
- Se o build falhar, copie os erros do log e procure por: módulos não encontrados, problemas com `esbuild`, dependências nativas (playwright etc) que estão marcadas como `external`.
- Mensagens comuns e ações:
  - "Cannot find module 'xxx'" → Instalar como dependência ou marcar como external no `build:vercel` se não for necessário no runtime.
  - Problemas com variáveis de ambiente → confirme que estão definidas em Vercel (Production vs Preview).
  - Erros em `drizzle` quando `DATABASE_URL` faltando → ok se você quiser rodar sem DB (código checa e continua), mas para funções que usam DB, defina `DATABASE_URL`.

ALTERNATIVA (RECOMENDADA SE PRECISAR DE STREAMING):
- Deploy da parte `api` num host com processo persistente (Render, Fly, DigitalOcean App Platform):
  1. Use o `Dockerfile` no repo (já atualizado para `pnpm run build:all`) e faça deploy automático no Render/Fly.
  2. Ajuste `EXPO_PUBLIC_API_BASE_URL` em Vercel para apontar para a URL pública do serviço backend.
  3. Mantém frontend no Vercel e backend em host separado.

CHECKLIST (marcar conforme completa)
- [ ] `pnpm install` executado localmente
- [ ] `pnpm run build:all` roda localmente sem erro
- [ ] `dist/api/index.js` existe localmente
- [ ] Criado projeto no Vercel apontando para o repositório
- [ ] Configurado Build Command = `pnpm run build:all`
- [ ] Configurado Output Directory = `dist`
- [ ] Variáveis de ambiente adicionadas no Vercel
- [ ] Build no Vercel completou sem erros
- [ ] Teste `GET /api/health` passou
- [ ] Frontend carrega e navega entre páginas
- [ ] Player carrega episódios (se não, avaliar mover backend)

Comandos úteis (PowerShell) — copiar/colar:
```powershell
# 1 - instalar dependências
cd C:\projetoAnimes\lg-anime
pnpm install

# 2 - construir tudo localmente
pnpm run build:all

# 3 - verificar bundle da API
Test-Path .\dist\api\index.js; Get-ChildItem .\dist\api | Format-List

# 4 - iniciar o servidor construído localmente (produção)
$env:NODE_ENV="production"; node .\dist\api\index.js

# 5 - teste de saúde
curl http://localhost:3000/api/health
```

OBSERVAÇÕES TÉCNICAS IMPORTANTES
- `vercel.json` já contém rewrites que direcionam `/api/*` para `dist/api/index.js`. Não remova sem entender.
- `drizzle.config.ts` está configurado para `dialect: "mysql"`. Se for migrar para Supabase/Postgres, atualize a config e `drizzle/schema.ts` para usar `pg`/`postgres-core` imports.
- O código do `lib/sqlite-db.ts` usa `expo-sqlite` para nativo e fallback para web; no backend hospedado em Vercel você provavelmente não terá o arquivo SQLite localmente persistente — prefira uma DB remota para produção.

Se quiser, crio também:
- Um pequeno `deploy-vercel.ps1` que verifica `dist`, roda `git add/commit/push` e mostra o link do deployment (via Vercel CLI) — me diga se prefere CLI (requer vercel login) ou via Git push automático.

---
Arquivo criado para acompanhamento: `VERCEL_DEPLOY_CHECKLIST.md`

Marque abaixo o que você quer que eu faça agora:
- [ ] Gerar script `deploy-vercel.ps1` (push + opcional Vercel CLI)
- [ ] Gerar script `deploy-backend-render.ps1` (build Docker + instruções para Render/Fly)
- [ ] Ajudar a interpretar logs de um build que falhou (cole o erro)



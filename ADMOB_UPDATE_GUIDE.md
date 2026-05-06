# Guia de Atualização - Anúncios Reais do Google AdMob

## ? O que foi atualizado

### 1. Migração do SDK
- **Removido**: `expo-ads-admob` (deprecated)
- **Adicionado**: `react-native-google-mobile-ads` (SDK atual)

### 2. Configuração do App
- **Arquivo**: `app.config.ts`
- **Adicionado**: Plugin do Google Mobile Ads com App IDs
```typescript
[
  "react-native-google-mobile-ads",
  {
    android_app_id: "ca-app-pub-7213751684524160~1234567890",
    ios_app_id: "ca-app-pub-7213751684524160~1234567890",
  },
],
```

### 3. Configuração de Anúncios
- **Arquivo**: `lib/config/admob-config.ts`
- **Atualizado**: IDs reais do AdMob (substitua pelos seus IDs)
- **Modo teste**: Desabilitado (`useTestAds: false`)

### 4. Hook de Anúncios
- **Arquivo**: `lib/hooks/use-admob-ads.ts`
- **Implementação**: Integração real com SDK do AdMob
- **Features**: 
  - Carregamento automático de anúncios
  - Event listeners (loaded, error, closed)
  - Pré-carregamento do próximo anúncio

### 5. Componente Modal
- **Arquivo**: `components/ad-modal.tsx`
- **Atualizado**: Suporte para anúncios reais do AdMob
- **Props**: Adicionado `interstitial` para controle do anúncio

## ? Próximos Passos Obrigatórios

### 1. Criar Ad Units no Console AdMob
1. Acesse [AdMob Console](https://admob.google.com)
2. Crie Ad Units para:
   - **Interstitial Ads** (Android e iOS)
   - **Banner Ads** (opcional)
   - **Rewarded Ads** (opcional)

### 2. Atualizar IDs Reais
Substitua os IDs placeholder em `lib/config/admob-config.ts`:

```typescript
adUnitIds: {
  interstitial: {
    android: "ca-app-pub-7213751684524160/SEU_ID_ANDROID", // Substitua
    ios: "ca-app-pub-7213751684524160/SEU_ID_IOS",     // Substitua
  },
  // ... outros tipos
},
```

### 3. Configurar App IDs
Atualize os App IDs em `app.config.ts`:

```typescript
[
  "react-native-google-mobile-ads",
  {
    android_app_id: "ca-app-pub-7213751684524160~SEU_APP_ID_ANDROID", // Substitua
    ios_app_id: "ca-app-pub-7213751684524160~SEU_APP_ID_IOS",     // Substitua
  },
],
```

### 4. Instalar Dependências
```bash
pnpm install
```

### 5. Limpar e Rebuild
```bash
# Limpar cache
pnpm run clean

# Rebuild para mobile
npx expo run:android
# ou
npx expo run:ios
```

## ? Testes

### Modo de Teste
Para testar sem gerar receita:
```typescript
// Em lib/config/admob-config.ts
testing: {
  useTestAds: true,  // Ativar modo de teste
  enableDebugLogging: true,
},
```

### IDs de Teste Disponíveis
- **Interstitial**: `ca-app-pub-3940256099942544/1033173712`
- **Banner**: `ca-app-pub-3940256099942544/6300978111`
- **Rewarded**: `ca-app-pub-3940256099942544/5224354917`

## ? Como Funciona

### Frequência de Anúncios
- Anúncios aparecem a cada 3 episódios (1º, 4º, 7º, etc.)
- Controle persistente via AsyncStorage
- Resetável via `resetFrequency()`

### Fluxo do Anúncio
1. Usuário navega para episódio
2. Sistema verifica frequência
3. Se deve mostrar: `AdModal` aparece
4. Anúncio carrega em background
5. Anúncio exibido em tela cheia
6. Ao fechar: vídeo pode ser reproduzido

### Tratamento de Erros
- Falha no carregamento ? Pula anúncio
- Sem conexão ? Tenta novamente depois
- Platform web ? Anúncios desabilitados

## ? Configurações Avançadas

### Personalização de Frequência
```typescript
// Em lib/config/admob-config.ts
frequency: {
  episodeInterval: 3,        // A cada X episódios
  minDisplayTime: 3000,     // Tempo mínimo exibido (ms)
  maxLoadAttempts: 3,       // Máximo de tentativas
},
```

### Anúncios Não Personalizados
```typescript
// Em lib/hooks/use-admob-ads.ts
const ad = InterstitialAd.createForAdRequest(finalAdUnitId, {
  requestNonPersonalizedAdsOnly: true, // GDPR compliance
});
```

## ? Monitoramento

### Console do AdMob
- Impressões de anúncios
- Receita gerada
- Taxa de cliques (CTR)
- Performance por plataforma

### Logs do App
Ative debug logging em desenvolvimento:
```typescript
testing: {
  enableDebugLogging: true,
},
```

## ?? Importante

1. **Políticas do AdMob**: Siga todas as políticas do Google
2. **Teste**: Sempre teste com IDs de teste primeiro
3. **Produção**: Desabilite modo de teste antes de publicar
4. **GDPR**: Implemente consentimento para usuários EU

## ? Troubleshooting

### Anúncios não aparecem?
1. Verifique IDs no console AdMob
2. Confirme modo de teste desativado
3. Verifique conexão com internet
4. Consulte logs do console

### Erro de carregamento?
1. Verifique App IDs em `app.config.ts`
2. Confirme Ad Unit IDs corretos
3. Limpe cache e rebuild

### Crash no app?
1. Verifique instalação do SDK
2. Confirme configuração no app.json
3. Teste com IDs de teste

---

## ? Suporte

Para dúvidas:
- [Documentação Oficial](https://rnfirebase.io/admob/usage)
- [Console do AdMob](https://admob.google.com)
- Logs detalhados do app

**Status da Atualização**: ? Completo
**Próximo Passo**: Configurar IDs reais no console AdMob

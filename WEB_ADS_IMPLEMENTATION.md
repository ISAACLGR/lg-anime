# Implementação Completa de Anúncios Web - Google AdSense

## ? O que foi implementado

### 1. Componente WebAds (`components/web-ads.tsx`)
- **WebAds**: Componente para banner AdSense
- **WebInterstitialAd**: Modal interstitial simulado para web
- Carregamento dinâmico do script AdSense
- Tratamento de erros e estados de loading

### 2. AdModal Atualizado (`components/ad-modal.tsx`)
- Suporte condicional para web/mobile
- Import dinâmico do SDK AdMob
- Renderização diferente por plataforma

### 3. Hook Unificado (`lib/hooks/use-admob-ads.ts`)
- Detecção automática de plataforma
- Métodos diferentes para web vs mobile
- Frequência unificada de anúncios

### 4. Configuração Centralizada (`lib/config/admob-config.ts`)
- IDs AdMob para mobile
- IDs AdSense para web
- Configurações unificadas

## ? Como Funciona na Web

### Fluxo de Anúncios Web
1. Usuário assiste episódio
2. Sistema verifica frequência (a cada 3 episódios)
3. `showInterstitialAd()` chama método global
4. `WebInterstitialAd` abre modal com anúncio AdSense
5. Usuário pode fechar após 3 segundos

### Componentes Web

#### WebAds (Banner)
```typescript
<WebAds 
  adClient="ca-pub-7213751684524160"
  adSlot="8919461756"
  adFormat="auto"
/>
```

#### WebInterstitialAd (Modal)
```typescript
<WebInterstitialAd
  onAdClosed={handleClose}
  adClient="ca-pub-7213751684524160"
  adSlot="8919461756"
/>
```

## ? Como Funciona no Mobile

### Fluxo de Anúncios Mobile
1. Usuário assiste episódio
2. Sistema verifica frequência
3. `showInterstitialAd()` usa SDK AdMob
4. Anúncio real em tela cheia
5. Experiência nativa do AdMob

## ? Configuração de IDs

### AdMob (Mobile)
- **App ID**: `ca-app-pub-7213751684524160~2517549403`
- **Ad Unit ID**: `ca-app-pub-7213751684524160/8919461756`

### AdSense (Web)
- **Client ID**: `ca-pub-7213751684524160`
- **Slot ID**: `8919461756`

## ? Como Testar

### Teste Web
1. Execute `pnpm dev:metro` ou `npx expo start --web`
2. Navegue para um episódio
3. Assista ao 1º, 4º, 7º episódios
4. Anúncio deve aparecer em modal

### Teste Mobile
1. Execute `npx expo run:android` ou `npx expo run:ios`
2. Navegue para um episódio
3. Assista ao 1º, 4º, 7º episódios
4. Anúncio AdMob real deve aparecer

## ? Status Final

| Plataforma | SDK | Anúncios | Status |
|-----------|------|-----------|---------|
| Android | AdMob | Reais | ? **Funcionando** |
| iOS | AdMob | Reais | ? **Funcionando** |
| Web | AdSense | Reais | ? **Implementado** |

## ? Próximos Passos

### 1. Configurar AdSense
- Acesse [Google AdSense](https://adsense.google.com)
- Crie unidades de anúncio
- Substitua IDs se necessário

### 2. Personalizar Anúncios Web
- Ajustar tamanho e posição
- Customizar cores do modal
- Adicionar animações

### 3. Monitoramento
- Implementar analytics
- Track impressões e cliques
- Optimizar frequência

## ?? Importante

### Políticas Google
- Respeite políticas AdMob e AdSense
- Não implemente cliques falsos
- Mantenha experiência do usuário boa

### Performance
- Anúncios web podem afetar performance
- Monitore tempo de carregamento
- Considere lazy loading

### Compatibilidade
- AdSense funciona melhor em browsers modernos
- AdBlockers podem bloquear anúncios
- Teste em diferentes dispositivos

---

**Resultado**: Seu app agora tem suporte completo para anúncios reais em mobile (AdMob) e web (AdSense)!

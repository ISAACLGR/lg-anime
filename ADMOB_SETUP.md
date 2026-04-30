# Google AdMob Integration Guide

Este documento descreve como configurar e usar o Google AdMob (Google Ads) no aplicativo AnimeFire.

## Configuração Atual

- **Publisher ID**: `pub-7213751684524160`
- **Client ID**: `277794`
- **Tipo de Anúncio**: Interstitial (Tela Cheia)
- **Frequência**: A cada 3 episódios (1º, 4º, 7º, etc.)

## Arquivos Principais

### 1. `lib/config/admob-config.ts`
Arquivo de configuração centralizado com todos os IDs e settings do AdMob.

```typescript
export const ADMOB_CONFIG = {
  publisherId: "pub-7213751684524160",
  clientId: "277794",
  adUnitIds: {
    interstitial: {
      android: "ca-app-pub-...",
      ios: "ca-app-pub-...",
    },
    // ... outros tipos de anúncios
  },
};
```

### 2. `lib/hooks/use-admob-ads.ts`
Hook React para gerenciar anúncios e frequência de exibição.

**Funcionalidades**:
- Controla a frequência de anúncios (a cada 3 episódios)
- Gerencia o carregamento de anúncios
- Persiste dados de frequência em AsyncStorage
- Fornece métodos para exibir e carregar anúncios

**Uso**:
```typescript
const { shouldShowAd, showInterstitialAd } = useAdMobAds();

// Verificar se deve mostrar anúncio
if (shouldShowAd()) {
  await showInterstitialAd();
}
```

### 3. `components/ad-modal.tsx`
Componente modal para exibir anúncios em tela cheia.

**Funcionalidades**:
- Modal com overlay escuro
- Placeholder enquanto o anúncio carrega
- Botão para fechar (após 3 segundos)
- Contador de tempo

**Props**:
```typescript
interface AdModalProps {
  visible: boolean;
  onClose: () => void;
  isLoading?: boolean;
}
```

### 4. `app/player/[slug].tsx`
Tela do player de episódios integrada com anúncios.

**Fluxo**:
1. Usuário navega para um episódio
2. `useEffect` verifica se deve mostrar anúncio
3. Se sim, `AdModal` é exibido
4. Após fechar o anúncio, o episódio pode ser reproduzido

## Como Funciona a Frequência de Anúncios

O sistema rastreia quantos episódios foram assistidos e mostra anúncios a cada 3 episódios:

```
Episódio 1 → Mostra Anúncio ✓
Episódio 2 → Sem Anúncio
Episódio 3 → Sem Anúncio
Episódio 4 → Mostra Anúncio ✓
Episódio 5 → Sem Anúncio
Episódio 6 → Sem Anúncio
Episódio 7 → Mostra Anúncio ✓
...
```

Os dados são armazenados em `AsyncStorage` com a chave `@animfire:ad_frequency`.

## Próximos Passos para Produção

### 1. Criar Ad Unit IDs no Console do AdMob

1. Acesse [AdMob Console](https://admob.google.com)
2. Crie um novo app (se não existir)
3. Crie Ad Units para:
   - **Interstitial Ads** (Android e iOS)
   - **Banner Ads** (opcional)
   - **Rewarded Ads** (opcional)
4. Copie os IDs e atualize em `lib/config/admob-config.ts`

### 2. Atualizar IDs de Teste para Produção

No arquivo `lib/config/admob-config.ts`, substitua os IDs de teste pelos reais:

```typescript
adUnitIds: {
  interstitial: {
    android: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx", // Seu ID real
    ios: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx",     // Seu ID real
  },
},
```

### 3. Desabilitar Modo de Teste

```typescript
testing: {
  useTestAds: false, // Mudar para false em produção
  enableDebugLogging: false,
},
```

### 4. Implementar Integração Real com expo-ads-admob

Atualmente, o hook `use-admob-ads.ts` usa uma implementação simulada. Para integração real:

```typescript
import { setTestDeviceIDAsync, requestInterstitialAd } from "expo-ads-admob";

// Configurar dispositivo de teste
await setTestDeviceIDAsync("EMULATOR");

// Carregar anúncio real
const adUnitId = getAdUnitId("interstitial", Platform.OS);
await requestInterstitialAd(adUnitId);
```

## Estrutura de Dados - AsyncStorage

### Chave: `@animfire:ad_frequency`

```typescript
{
  lastAdShownAt: 1706779200000,  // Timestamp do último anúncio
  episodeCount: 4                 // Total de episódios assistidos
}
```

## Tratamento de Erros

O sistema trata os seguintes cenários:

1. **Anúncio falha ao carregar**: Pula o anúncio e permite assistir
2. **Usuário fecha o modal**: Registra como anúncio exibido
3. **Sem conexão**: Tenta novamente na próxima tentativa
4. **Platform não suportada**: Desabilita anúncios (ex: web)

## Testes

### Teste Local

1. Use os IDs de teste fornecidos em `admob-config.ts`
2. Execute o app em um emulador ou dispositivo
3. Navegue para o player e assista episódios
4. Verifique se anúncios aparecem a cada 3 episódios

### Teste em Produção

1. Atualize com IDs reais do AdMob
2. Desabilite modo de teste
3. Publique o app
4. Monitore receitas no console do AdMob

## Monitoramento

No console do AdMob, você pode:

- Ver impressões de anúncios
- Rastrear receita
- Analisar taxa de cliques (CTR)
- Otimizar frequência de anúncios

## Referências

- [Google AdMob Documentation](https://admob.google.com/home)
- [expo-ads-admob Package](https://docs.expo.dev/versions/latest/sdk/admob/)
- [AdMob Best Practices](https://support.google.com/admob/answer/6128877)

## Suporte

Para dúvidas ou problemas:

1. Verifique os logs do console
2. Confirme que os IDs estão corretos
3. Teste com IDs de teste primeiro
4. Consulte a documentação oficial do AdMob

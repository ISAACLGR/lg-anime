# Anúncios AdMob na Web - Limitações e Soluções

## ? Limitação Importante

O **Google AdMob para React Native NÃO funciona na web**. O SDK `react-native-google-mobile-ads` é específico para:
- ? Android
- ? iOS  
- ? **Web (não suportado)**

## ? Implementação Atual

O código foi atualizado para lidar com isso:

### 1. Plugin Condicional
```typescript
// app.config.ts
...(process.env.EXPO_PLATFORM !== 'web' ? [
  [
    "react-native-google-mobile-ads",
    {
      android_app_id: "ca-app-pub-7213751684524160~2517549403",
      ios_app_id: "ca-app-pub-7213751684524160~2517549403",
    },
  ],
] : []),
```

### 2. Import Condicional
```typescript
// use-admob-ads.ts
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;

if (Platform.OS !== 'web') {
  try {
    const admob = require("react-native-google-mobile-ads");
    InterstitialAd = admob.InterstitialAd;
    AdEventType = admob.AdEventType;
    TestIds = admob.TestIds;
  } catch (error) {
    console.warn("react-native-google-mobile-ads not available on web platform");
  }
}
```

### 3. Verificação de Plataforma
```typescript
const loadInterstitialAd = useCallback(async () => {
  if (!Platform.OS || Platform.OS === "web" || !InterstitialAd) {
    console.log("Ads not supported on web platform or SDK not available");
    return;
  }
  // ... resto do código
}, []);
```

## ? Alternativas para Web

Se você precisa de anúncios na versão web, considere:

### Opção 1: Google AdSense (HTML)
```html
<!-- AdSense para web -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-7213751684524160"
     data-ad-slot="1234567890"
     data-ad-format="auto"></ins>
<script>
(adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

### Opção 2: Componente Web Separado
Criar componente específico para web:
```typescript
// components/web-ads.tsx
import { useEffect } from 'react';

export function WebAds() {
  useEffect(() => {
    // Carregar AdSense dinamicamente
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return (
    <ins 
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-7213751684524160"
      data-ad-slot="1234567890"
      data-ad-format="auto"
    />
  );
}
```

### Opção 3: WebView com Anúncios
Usar WebView para exibir página com anúncios:
```typescript
// Componente para mobile com WebView
<WebView
  source={{ html: adSenseHTML }}
  style={{ height: 250 }}
/>
```

## ? Como Funciona Agora

### Mobile (Android/iOS)
- ? Anúncios reais do AdMob funcionam
- ? IDs reais configurados
- ? SDK completo disponível

### Web
- ? SDK AdMob não disponível  
- ? App funciona sem erros
- ? Frequência de anúncios registrada
- ? Modal mostra placeholder

## ? Fluxo de Anúncios

### Mobile
1. Usuário assiste episódio
2. Sistema verifica frequência
3. Anúncio real carrega
4. Anúncio exibido em tela cheia
5. Usuário fecha ? continua vídeo

### Web
1. Usuário assiste episódio
2. Sistema verifica frequência
3. **Pula carregamento de anúncio**
4. **Mostra modal informativo**
5. Usuário fecha ? continua vídeo

## ? Recomendações

### Para Produção
1. **Mobile**: Use AdMob como configurado
2. **Web**: Implemente AdSense separadamente
3. **Monitore**: Analytics para cada plataforma

### Para Desenvolvimento
1. Teste mobile em dispositivo real
2. Teste web sem anúncios (funcional)
3. Verifique console para warnings

## ? Status Atual

| Plataforma | SDK AdMob | Anúncios | Status |
|-----------|------------|-----------|---------|
| Android | ? Disponível | ? Reais | **Funcionando** |
| iOS | ? Disponível | ? Reais | **Funcionando** |
| Web | ? Não disponível | ? N/A | **Sem erros** |

---

**Conclusão**: O app está pronto para anúncios reais em mobile e funciona sem erros na web. Para anúncios na web, implemente AdSense separadamente.

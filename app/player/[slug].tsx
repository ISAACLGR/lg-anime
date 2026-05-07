import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { VideoView, useVideoPlayer } from "expo-video";
import { AdModal } from "@/components/ad-modal";
import { useAdMobAds } from "@/lib/hooks/use-admob-ads";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { Platform } from "react-native";
import { WebView } from "react-native-webview";

// Detectar se está no servidor ou cliente
const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer ? 'http://localhost:3000' : (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.190:3000');

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
}

export default function PlayerScreen() {
  const router = useRouter();
  const { slug, episode, url } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isFullscreen: false,
  });
  const [videoData, setVideoData] = useState<any>(null);
  const [useWebView, setUseWebView] = useState(false);

  const { shouldShowAd, isAdReady, isAdLoading, interstitial, isWeb, frequencyData } = useAdMobAds();

  // Fallback video URL (usado se extractVideo falhar)
  const fallbackVideoUrl =
    "https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4";

  const shouldUseIframe = !!videoData?.iframeSrc && !videoData?.videoUrl;
  const player = useVideoPlayer(
    (useWebView || shouldUseIframe || videoData?.method === 'webview-iframe') ? null : (videoData?.videoUrl || fallbackVideoUrl),
    (player) => {
      player.loop = false;
    }
  );

  useEffect(() => {
    if (url) {
      extractVideoData();
    }
  }, [slug, episode, url]);

  const IframePlayer = ({ iframeSrc, title }: { iframeSrc: string; title?: string }) => {
  if (Platform.OS === 'web') {
    // Para web, usar iframe nativo do HTML
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#000',
          position: 'relative',
          minHeight: '240px'
        }}
        dangerouslySetInnerHTML={{
          __html: `
            <div style="position: absolute; top: 0; left: 0; right: 0; z-index: 10000; padding: 12px; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; text-align: center; pointer-events: none;">
              <span style="color: white; font-weight: bold; font-size: 18px;">${title || ''}</span>
            </div>
            <iframe 
              src="${iframeSrc}"
              style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: none;
                min-height: 240px;
                z-index: 1;
              "
              allowfullscreen="true"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              frameborder="0"
              scrolling="no"
            />
          `
        }}
      />
    );
  } else {
    // Para mobile, usar WebView do React Native
    return (
      <WebView
        source={{ html: generateIframeHtml(iframeSrc) }}
        style={{ flex: 1, minHeight: 240 }}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#000'
          }}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text className="text-white mt-4">Carregando iframe...</Text>
          </View>
        )}
      />
    );
  }
};

const WebVideoPlayer = ({ videoUrl, title, episodeUrl }: { videoUrl: string; title?: string; episodeUrl?: string }) => {
  // SEMPRE usar proxy para vídeos externos (evitar problemas de token/IP)
  const proxyVideoUrl = `${API_BASE_URL}/proxy-video?videoUrl=${encodeURIComponent(videoUrl)}&episodeUrl=${encodeURIComponent(episodeUrl || '')}`;

    console.log('🎥 completo', proxyVideoUrl);

    console.log('🎥 WebVideoPlayer - URL original:', videoUrl?.substring(0, 60) + '...');
  console.log('🎥 WebVideoPlayer - URL proxy:', proxyVideoUrl?.substring(0, 60) + '...');
  console.log('🎥 WebVideoPlayer - Platform:', Platform.OS);
  
  if (Platform.OS === 'web') {
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#000',
          position: 'relative',
          minHeight: '240px'
        }}
        dangerouslySetInnerHTML={{
          __html: `
            <div style="position: absolute; top: 0; left: 0; right: 0; z-index: 10000; padding: 12px; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; text-align: center; pointer-events: none;">
              <span style="color: white; font-weight: bold; font-size: 18px;">${title || ''}</span>
            </div>
            <video
              src="${proxyVideoUrl}"
              controls
              autoplay
              preload="auto"
              buffered
              style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: contain;
                z-index: 1;
              "
              playsinline
              allowfullscreen
            >
              Seu navegador não suporta reprodução de vídeo.
            </video>
          `
        }}
      />
    );
  } else {
    // Para mobile, usar WebView com HTML5 video (usando proxy URL)
    const mobileHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body, html {
            width: 100%;
            height: 100%;
            background: #000;
            overflow: hidden;
          }
          .container {
            position: relative;
            width: 100%;
            height: 100%;
          }
          .title-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            padding: 10px;
            background: rgba(0,0,0,0.7);
            text-align: center;
          }
          .title-bar span {
            color: white;
            font-weight: bold;
            font-size: 16px;
          }
          video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            background: #000;
          }
          .error-msg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            text-align: center;
            display: none;
          }
          .play-btn {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: rgba(124, 58, 237, 0.9);
            border-radius: 50%;
            border: none;
            color: white;
            font-size: 30px;
            cursor: pointer;
            z-index: 2000;
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="title-bar">
            <span>${title || 'Vídeo'}</span>
          </div>
          <video
            id="videoPlayer"
            src="${proxyVideoUrl}"
            controls
            playsinline
            webkit-playsinline
            x5-playsinline
            preload="metadata"
          >
            Seu navegador não suporta reprodução de vídeo.
          </video>
          <button class="play-btn" id="playBtn">▶</button>
          <div class="error-msg" id="errorMsg">
            <p>Erro ao carregar vídeo</p>
            <p id="errorDetails"></p>
          </div>
        </div>
        <script>
          (function() {
            var video = document.getElementById('videoPlayer');
            var playBtn = document.getElementById('playBtn');
            var errorMsg = document.getElementById('errorMsg');
            var errorDetails = document.getElementById('errorDetails');
            
            function log(msg) {
              console.log('[VideoMobile]', msg);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'log', message: msg}));
              }
            }
            
            log('Video URL: ' + video.src.substring(0, 50) + '...');
            
            // Mostrar botão play se autoplay falhar
            function showPlayButton() {
              playBtn.style.display = 'block';
              log('Mostrando botão play manual');
            }
            
            playBtn.addEventListener('click', function() {
              video.play().then(function() {
                playBtn.style.display = 'none';
                log('Play manual funcionou!');
              }).catch(function(e) {
                log('Erro no play manual: ' + e.message);
              });
            });
            
            video.addEventListener('canplay', function() {
              log('Video canplay - tentando autoplay');
              video.play().then(function() {
                log('Autoplay OK');
              }).catch(function(e) {
                log('Autoplay bloqueado: ' + e.message);
                showPlayButton();
              });
            });
            
            video.addEventListener('error', function(e) {
              var error = video.error;
              var msg = error ? ('CODE: ' + error.code + ' - ' + error.message) : 'Unknown';
              log('ERRO VIDEO: ' + msg);
              errorDetails.textContent = msg;
              errorMsg.style.display = 'block';
            });
            
            video.addEventListener('waiting', function() {
              log('Video buffering...');
            });
            
            video.addEventListener('playing', function() {
              log('Video playing!');
              playBtn.style.display = 'none';
            });
            
            video.addEventListener('stalled', function() {
              log('Video stalled - possível problema de rede');
            });
            
            // Tentar carregar
            video.load();
            log('Video load() chamado');
          })();
        </script>
      </body>
      </html>
    `;
    
    return (
      <WebView
        source={{ html: mobileHtml }}
        style={{ flex: 1, minHeight: 240, backgroundColor: '#000' }}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        allowsBackForwardNavigationGestures={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'log') {
              console.log('📱 [WebView]', data.message);
            }
          } catch (e) {
            console.log('📱 [WebView]', event.nativeEvent.data);
          }
        }}
        renderLoading={() => (
          <View style={{ 
            flex: 1,
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#000'
          }}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={{ color: 'white', marginTop: 10 }}>Carregando vídeo...</Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('❌ WebView error:', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('❌ WebView HTTP error:', nativeEvent);
        }}
        onLoadEnd={() => {
          console.log('✅ WebView carregado');
        }}
      />
    );
  }
};

const generateIframeHtml = (iframeSrc: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: #000;
            overflow: hidden;
        }
        iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <iframe 
        src="${iframeSrc}" 
        allowfullscreen="true"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        frameborder="0"
        scrolling="no">
    </iframe>
</body>
</html>
  `.trim();
};

const extractVideoFromIframe = async (iframeSrc: string, episodeUrl: string): Promise<string | null> => {
    try {
      console.log('🔍 Tentando extrair vídeo do iframe:', iframeSrc);
      
      // Para iframes do Blogger, tentar extrair o token e construir URL direta
      if (iframeSrc.includes('blogger.com/video.g')) {
        const tokenMatch = iframeSrc.match(/token=([^&]+)/);
        if (tokenMatch) {
          const token = decodeURIComponent(tokenMatch[1]);
          console.log('🔑 Token do Blogger encontrado:', token.substring(0, 50) + '...');
          
          // Tentar diferentes padrões de URL do Blogger
          const possibleUrls = [
            `https://www.blogger.com/video.g?token=${token}`,
            `https://video.google.com/getvideobyid?token=${token}`,
            // Tentar extrair ID do token para outras URLs
          ];
          
          for (const url of possibleUrls) {
            try {
              console.log('🎯 Testando URL:', url);
              const response = await fetch(url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Referer': episodeUrl
                }
              });
              
              if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('video')) {
                  console.log('✅ URL de vídeo encontrada:', url);
                  return url;
                }
                
                // Se não for vídeo direto, tentar extrair do HTML
                const html = await response.text();
                const videoUrlMatch = html.match(/https:\/\/[^"'\s]*\.mp4[^"'\s]*/);
                if (videoUrlMatch) {
                  console.log('✅ URL de vídeo extraída do HTML:', videoUrlMatch[0]);
                  return videoUrlMatch[0];
                }
              }
            } catch (error) {
              console.log('❌ Falha ao testar URL:', url, error.message);
              continue;
            }
          }
        }
      }
      
      // Para outros tipos de iframe, tentar acessar e procurar URLs de vídeo
      try {
        const response = await fetch(iframeSrc, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': episodeUrl
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Procurar por padrões de URL de vídeo no HTML
          const videoPatterns = [
            /https:\/\/[^"'\s]*\.mp4[^"'\s]*/gi,
            /https:\/\/[^"'\s]*video[^"'\s]*/gi,
            /src=["']([^"']*\.(mp4|webm|avi|mov))["']/gi
          ];
          
          for (const pattern of videoPatterns) {
            const matches = html.match(pattern);
            if (matches && matches.length > 0) {
              console.log('✅ URL de vídeo encontrada no iframe:', matches[0]);
              return matches[0];
            }
          }
        }
      } catch (error) {
        console.log('❌ Falha ao acessar iframe:', error.message);
      }
      
      console.log('❌ Não foi possível extrair vídeo do iframe - VideoView não consegue reproduzir URLs de iframe');
      // Não retornar iframe URL pois VideoView não consegue reproduzir
      return null;
    } catch (error) {
      console.error('Erro em extractVideoFromIframe:', error);
      return null;
    }
  };

const extractVideoData = async () => {
    try {
      setLoading(true);
      setError(null);

      const episodeUrl = decodeURIComponent(url as string);
      
      // Usar endpoint correto do server TypeScript
      const response = await fetch(`${API_BASE_URL}/api/animefire/extractVideo?url=${encodeURIComponent(episodeUrl)}`);
      const data = await response.json();

      console.log('🎬 Video extraction result:', data);

      if (data.error || !data.success) {
        setError(data.error || 'Falha ao extrair vídeo');
      } else {
        // Usar videoUrl direto do extractVideo (sem proxy)
        const videoUrl = data.videoUrl || null;
        const iframeSrc = data.iframeSrc || null;
        
        if (iframeSrc && !videoUrl) {
          console.log('📺 Apenas iframe encontrado, tentando extrair vídeo:', iframeSrc);
          
          // Tentar extrair vídeo do iframe (especialmente Blogger)
          try {
            const extractedVideo = await extractVideoFromIframe(iframeSrc, episodeUrl);
            if (extractedVideo) {
              console.log('✅ Vídeo extraído do iframe:', extractedVideo);
              // Se a URL extraída ainda for um iframe (blogger.com), usar WebView
              if (extractedVideo.includes('blogger.com') || extractedVideo.includes('iframe')) {
                console.log('📱 URL extraída ainda é iframe, usando WebView');
                setUseWebView(true);
                setVideoData({
                  videoUrl: null,
                  iframeSrc: extractedVideo,
                  allQualities: data.allQualities || [],
                  episodeUrl: data.episodeUrl || episodeUrl,
                  method: 'webview-iframe'
                });
              } else {
                // MOBILE: Forçar uso de iframe mesmo quando vídeo é extraído
                if (Platform.OS !== 'web') {
                  console.log('📱 MOBILE detectado - Forçando iframe mesmo com vídeo extraído');
                  setUseWebView(true);
                  setVideoData({
                    videoUrl: null,
                    iframeSrc: iframeSrc,
                    allQualities: data.allQualities || [],
                    episodeUrl: data.episodeUrl || episodeUrl,
                    method: 'webview-iframe-mobile-forced'
                  });
                } else {
                  console.log('🎬 URL de vídeo direta encontrada, usando VideoView');
                  
                  // Usar URL direta - o WebVideoPlayer vai construir o proxy URL se necessário
                  setVideoData({
                    videoUrl: extractedVideo,
                    iframeSrc: iframeSrc,
                    allQualities: data.allQualities || [],
                    episodeUrl: episodeUrl,
                    method: 'iframe-extracted',
                    originalVideoUrl: extractedVideo
                  });
                }
              }
            } else {
              console.log('📱 Usando WebView para reproduzir iframe');
              setUseWebView(true);
              setVideoData({
                videoUrl: null,
                iframeSrc: iframeSrc,
                allQualities: data.allQualities || [],
                episodeUrl: data.episodeUrl || episodeUrl,
                method: 'webview-iframe'
              });
            }
          } catch (error) {
            console.error('Erro ao extrair vídeo do iframe:', error);
            setError('Vídeo disponível apenas via iframe (não suportado no app)');
            setVideoData({
              videoUrl: null,
              iframeSrc: iframeSrc,
              allQualities: data.allQualities || [],
              episodeUrl: data.episodeUrl || episodeUrl,
              method: 'iframe-only'
            });
          }
        } else if (videoUrl) {
          console.log('✅ Usando videoUrl direto:', videoUrl);
          console.log('🎬 Episode URL para proxy:', episodeUrl);
          
          // MOBILE: Forçar uso de iframe para melhor compatibilidade
          if (Platform.OS !== 'web' && iframeSrc) {
            console.log('📱 MOBILE detectado - Forçando uso de iframe para compatibilidade');
            setUseWebView(true);
            setVideoData({
              videoUrl: null,
              iframeSrc: iframeSrc,
              allQualities: data.allQualities || [],
              episodeUrl: data.episodeUrl || episodeUrl,
              method: 'webview-iframe-mobile'
            });
          } else {
            // WEB: Usar URL direta - o WebVideoPlayer vai construir o proxy URL se necessário
            setVideoData({
              videoUrl: videoUrl,
              iframeSrc: iframeSrc || null,
              allQualities: data.allQualities || [],
              episodeUrl: episodeUrl,
              method: data.method || 'direct-video',
              originalVideoUrl: videoUrl
            });
          }
        } else {
          setError('Nenhuma fonte de vídeo encontrada');
        }
      }

      // Mostrar anúncio se necessário
      console.log('🎯 Verificando se deve mostrar anúncio:', {
        episodeCount: frequencyData.episodeCount,
        shouldShow: shouldShowAd(),
        isWeb,
        isAdReady
      });
      
      if (shouldShowAd()) {
        console.log('🚀 Mostrando anúncio!');
        setShowAd(true);
      } else {
        console.log('⏭️ Anúncio não necessário neste episódio');
      }

      setLoading(false);
    } catch (error) {
      console.error("Error extracting video:", error);
      setError('Erro ao carregar vídeo');
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    setPlayerState((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  const handleAdClose = async () => {
    setShowAd(false);
  };

  const handleNextEpisode = () => {
    const nextEp = (parseInt(episode as string) || 1) + 1;
    router.setParams({ episode: nextEp.toString() });
  };

  const handlePreviousEpisode = () => {
    const prevEp = Math.max((parseInt(episode as string) || 1) - 1, 1);
    router.setParams({ episode: prevEp.toString() });
  };

  const handleSelectSource = (index: number) => {
    setSelectedSourceIndex(index);
    // Atualizar URL do vídeo quando selecionar nova qualidade
    if (videoData?.allQualities && videoData.allQualities[index]) {
      const newVideoUrl = videoData.allQualities[index].src;
      const label = videoData.allQualities[index].label;
      console.log('🎬 Switching to quality:', label, newVideoUrl);
      
      // Usar URL direta - WebVideoPlayer vai construir proxy se necessário
      setVideoData(prev => ({
        ...prev,
        videoUrl: newVideoUrl,
        originalVideoUrl: newVideoUrl
      }));
      
      // Não precisa recriar player - WebVideoPlayer vai atualizar automaticamente
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-white mt-4">Carregando episódio...</Text>
      </ScreenContainer>
    );
  }

  const currentVideoUrl = videoData?.videoUrl;
  const hasRealVideo = !!currentVideoUrl && !currentVideoUrl.includes('blogger.com');
  const hasIframe = !!videoData?.iframeSrc;
  const isFallback = !hasRealVideo && !hasIframe;
  const isIframeOnly = hasIframe && !hasRealVideo;

  return (
    <>
      <AdModal 
        visible={showAd} 
        onClose={handleAdClose} 
        isLoading={isAdLoading}
        interstitial={interstitial}
        isWeb={isWeb}
      />
      <ScreenContainer className="p-0 bg-black">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Video Player */}
          <View className="bg-black aspect-[4/3] max-h-64 relative">
            {/* VÍDEO DIRETO (prioridade) - só se tiver videoUrl real */}
            {hasRealVideo ? (
              <WebVideoPlayer 
                videoUrl={currentVideoUrl} 
                title={`${slug} - Episódio ${episode}`}
                episodeUrl={videoData?.episodeUrl}
              />
            ) : /* IFRAME (fallback) - usar iframe se disponível */ 
            hasIframe ? (
              <IframePlayer 
                iframeSrc={videoData.iframeSrc} 
                title={`${slug} - Episódio ${episode}`} 
              />
            ) : (
              <VideoView
                player={player}
                allowsFullscreen
                allowsPictureInPicture
                style={{ flex: 1 }}
              />
            )}
          </View>

          {/* Video Info */}
          <View className="px-4 py-4">
            {isIframeOnly && (
              <View className="bg-green-500/20 border border-green-500 rounded-lg p-3 mb-4">
                <Text className="text-green-400 text-sm">
                    🔍 Vídeo extraído do iframe</Text>
              </View>
            )}

            {isFallback && (
              <View className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 mb-4">
                <Text className="text-yellow-400 text-sm">
                  ⚠️ Usando vídeo de demonstração. Vídeo real não disponível.
                </Text>
              </View>
            )}

            {error && (
              <View className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            )}

            {videoData?.method && !isIframeOnly && (
              <View className="bg-green-500/20 border border-green-500 rounded-lg p-3 mb-4">
                <Text className="text-green-400 text-sm">
                  ✅ Fonte: {videoData.method} | Qualidades: {videoData.allQualities?.length || 1}
                  </Text>
                {videoData.method === 'iframe-extracted' && (
                  <Text className="text-green-300 text-xs mt-1">
                    🔍 Vídeo extraído do iframe
                  </Text>
                )}
                {videoData.method === 'iframe-extracted' && videoData.videoUrl?.includes('blogger.com') && (
                  <Text className="text-green-300 text-xs mt-1">
                    🎬 Usando iframe como vídeo (fallback)
                  </Text>
                )}
                {videoData.method === 'webview-iframe' && (
                  <Text className="text-green-300 text-xs mt-1">
                    🌐 Reproduzindo via WebView (iframe)
                  </Text>
                )}
                {videoData.method === 'direct-video' && videoData.originalVideoUrl && (
                  <Text className="text-green-300 text-xs mt-1">
                    🎬 Vídeo direto (sem proxy)
                  </Text>
                )}
                {videoData.iframeSrc && (
                  <Text className="text-green-300 text-xs mt-1">
                    📺 Iframe também disponível (web only)
                  </Text>
                )}
              </View>
            )}

            {/* Video Sources Selection */}
            {videoData?.allQualities && videoData.allQualities.length > 1 && (
              <View className="mb-4">
                <Text className="text-white text-sm font-semibold mb-2">Qualidade:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-2"
                >
                  {videoData.allQualities.map((source, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSelectSource(index)}
                      className={`px-4 py-2 rounded-lg ${
                        selectedSourceIndex === index
                          ? "bg-primary"
                          : "bg-surface border border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          selectedSourceIndex === index
                            ? "text-white"
                            : "text-foreground"
                        }`}
                      >
                        {source.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Controls */}
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity
                onPress={handlePreviousEpisode}
                className="flex-1 bg-primary py-3 rounded-lg items-center"
              >
                <Text className="text-white font-bold">← Anterior</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePlayPause}
                className="flex-1 bg-primary py-3 rounded-lg items-center"
              >
                <Text className="text-white font-bold">
                  {playerState.isPlaying ? "⏸ Pausar" : "▶ Reproduzir"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextEpisode}
                className="flex-1 bg-primary py-3 rounded-lg items-center"
              >
                <Text className="text-white font-bold">Próximo →</Text>
              </TouchableOpacity>
            </View>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-surface border border-border py-3 rounded-lg items-center"
            >
              <Text className="text-foreground font-semibold">← Voltar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    </>
  );
}

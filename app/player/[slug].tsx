import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { VideoView, useVideoPlayer } from "expo-video";
import { AdModal } from "@/components/ad-modal";
import { useAdMobAds } from "@/lib/hooks/use-admob-ads";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Platform } from "react-native";
import { WebView } from "react-native-webview";

// Detectar se está no servidor ou cliente
const isServer = typeof window === "undefined";
const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const getApiCandidates = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const candidates = [
    envUrl,
    DEFAULT_API_BASE_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    candidates.unshift(
      `${protocol}//${hostname}:3000`,
      `${protocol}//127.0.0.1:3000`,
    );
  }

  return Array.from(new Set(candidates.filter(Boolean) as string[]));
};

const resolveApiBaseUrl = async () => {
  const candidates = getApiCandidates();

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        method: "GET",
        cache: "no-store",
      });
      if (response.ok) {
        return baseUrl;
      }
    } catch {
      // continue to next candidate
    }
  }

  return candidates[0] || DEFAULT_API_BASE_URL;
};

const API_BASE_URL = isServer
  ? DEFAULT_API_BASE_URL
  : process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_BASE_URL;

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
  const [selectedAudio, setSelectedAudio] = useState<
    "legendado" | "dublado" | "default"
  >("default");
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isFullscreen: false,
  });
  const [videoData, setVideoData] = useState<any>(null);
  const [useWebView, setUseWebView] = useState(false);

  const {
    shouldShowAd,
    isAdReady,
    isAdLoading,
    interstitial,
    isWeb,
    frequencyData,
  } = useAdMobAds();
  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

  const getEffectiveApiBaseUrl = async () => {
    const resolved = await resolveApiBaseUrl();
    return resolved;
  };

  const parseQualityValue = (label?: string) => {
    const match = String(label || "0p").match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  const normalizeQualityList = (sources: any[] = []) => {
    const seen = new Map<string, any>();

    sources.forEach((source) => {
      const label = String(source?.label || "480p").trim();
      const audio = String(source?.audio || "desconhecido").trim();
      const key = `${audio.toLowerCase()}|${label.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.set(key, { ...source, label, audio });
      }
    });

    return Array.from(seen.values()).sort(
      (a, b) => parseQualityValue(b.label) - parseQualityValue(a.label),
    );
  };

  const resolveAudioOptions = (sources: any[] = []) => {
    const uniqueAudio = Array.from(
      new Set(
        sources
          .map((source) => String(source?.audio || "").trim())
          .filter(Boolean),
      ),
    );

    if (!uniqueAudio.length) {
      return [{ key: "default", label: "Original", value: "default" }];
    }

    return uniqueAudio.map((audio) => ({
      key: audio,
      label:
        audio === "legendado"
          ? "Legendado"
          : audio === "dublado"
            ? "Dublado"
            : audio,
      value: audio,
    }));
  };

  // Fallback video URL (usado se extractVideo falhar)
  const fallbackVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";

  const shouldUseIframe = !!videoData?.iframeSrc && !videoData?.videoUrl;
  const player = useVideoPlayer(
    useWebView || shouldUseIframe || videoData?.method === "webview-iframe"
      ? null
      : videoData?.videoUrl || fallbackVideoUrl,
    (player) => {
      player.loop = false;
    },
  );

  useEffect(() => {
    const normalizedUrl = Array.isArray(url) ? url[0] : url;
    if (normalizedUrl || slug) {
      extractVideoData();
    }
  }, [slug, episode, url]);

  const IframePlayer = ({
    iframeSrc,
    title,
  }: {
    iframeSrc: string;
    title?: string;
  }) => {
    if (Platform.OS === "web") {
      // Para web, usar iframe nativo do HTML
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#000",
            position: "relative",
            minHeight: "240px",
          }}
          dangerouslySetInnerHTML={{
            __html: `
            <div style="position: absolute; top: 0; left: 0; right: 0; z-index: 10000; padding: 12px; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; text-align: center; pointer-events: none;">
              <span style="color: white; font-weight: bold; font-size: 18px;">${title || ""}</span>
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
          `,
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
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#000",
              }}
            >
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text className="text-white mt-4">Carregando iframe...</Text>
            </View>
          )}
        />
      );
    }
  };

  const isHlsStream = (value?: string) => {
    if (!value) return false;
    const normalized = value.toLowerCase();
    return (
      normalized.includes(".m3u8") ||
      normalized.includes("application/vnd.apple.mpegurl") ||
      normalized.includes("playlist.m3u8") ||
      normalized.includes("akumast.net") ||
      normalized.includes("m3u8") ||
      normalized.includes("/h.jpg") ||
      normalized.includes("h.jpg?")
    );
  };

  const WebVideoPlayer = ({
    videoUrl,
    title,
    episodeUrl,
    contentType,
  }: {
    videoUrl: string;
    title?: string;
    episodeUrl?: string;
    contentType?: string;
  }) => {
    const safeContentType = typeof contentType === "string" ? contentType : "";
    const proxyVideoUrl = `${API_BASE_URL}/proxy-video?videoUrl=${encodeURIComponent(videoUrl)}&episodeUrl=${encodeURIComponent(episodeUrl || "")}`;
    const hlsPlaylist =
      isHlsStream(videoUrl) ||
      isHlsStream(proxyVideoUrl) ||
      (safeContentType
        ? safeContentType.toLowerCase().includes("mpegurl")
        : false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    console.log(
      "🎥 WebVideoPlayer - URL original:",
      videoUrl?.substring(0, 60) + "...",
    );
    console.log(
      "🎥 WebVideoPlayer - URL proxy:",
      proxyVideoUrl?.substring(0, 60) + "...",
    );
    console.log("🎥 WebVideoPlayer - HLS:", hlsPlaylist);

    useEffect(() => {
      if (Platform.OS !== "web" || !videoRef.current) return;

      const video = videoRef.current;

      const onCanPlay = () => {
        video.play().catch(() => undefined);
      };

      video.addEventListener("canplay", onCanPlay, { once: true });

      if (!hlsPlaylist) {
        video.src = proxyVideoUrl;
        video.load();
        return () => {
          video.pause();
          video.removeAttribute("src");
          video.load();
          video.removeEventListener("canplay", onCanPlay);
        };
      }

      let hls: any = null;
      const setupHls = () => {
        const HlsCtor = (window as any).Hls;
        if (!HlsCtor || !HlsCtor.isSupported()) {
          video.src = proxyVideoUrl;
          video.load();
          video.play().catch(() => undefined);
          return;
        }

        hls = new HlsCtor({ startLevel: -1, debug: false });
        hls.loadSource(proxyVideoUrl);
        hls.attachMedia(video);
        hls.on(HlsCtor.Events.ERROR, (_event: any, data: any) => {
          console.error("HLS error", data);
        });
        hls.on(HlsCtor.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => undefined);
        });
      };

      const existingScript = document.querySelector(
        'script[data-hls-loader="animefire"]',
      ) as HTMLScriptElement | null;
      if ((window as any).Hls && (window as any).Hls.isSupported()) {
        setupHls();
      } else if (existingScript) {
        existingScript.addEventListener("load", setupHls, { once: true });
      } else {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/hls.js@1.6.12/dist/hls.min.js";
        script.async = true;
        script.setAttribute("data-hls-loader", "animefire");
        script.onload = setupHls;
        document.head.appendChild(script);
      }

      return () => {
        if (hls) {
          hls.destroy();
        }
        if (video) {
          video.pause();
          video.removeAttribute("src");
          video.load();
        }
        video.removeEventListener("canplay", onCanPlay);
      };
    }, [hlsPlaylist, proxyVideoUrl]);

    if (Platform.OS === "web") {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#000",
            position: "relative",
            minHeight: "240px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10000,
              padding: "12px",
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{ color: "white", fontWeight: "bold", fontSize: "18px" }}
            >
              {title || ""}
            </span>
          </div>
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            preload="auto"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              zIndex: 1,
              backgroundColor: "#000",
            }}
          />
        </div>
      );
    }

    const mobileHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: 100%; height: 100%; background: #000; overflow: hidden; }
          .container { position: relative; width: 100%; height: 100%; }
          .title-bar { position: absolute; top: 0; left: 0; right: 0; z-index: 1000; padding: 10px; background: rgba(0,0,0,0.7); text-align: center; }
          .title-bar span { color: white; font-weight: bold; font-size: 16px; }
          video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; background: #000; }
          .error-msg { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; text-align: center; display: none; }
          .play-btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px; background: rgba(124, 58, 237, 0.9); border-radius: 50%; border: none; color: white; font-size: 30px; cursor: pointer; z-index: 2000; display: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="title-bar"><span>${title || "Vídeo"}</span></div>
          <video id="videoPlayer" controls playsinline webkit-playsinline x5-playsinline preload="metadata"></video>
          <button class="play-btn" id="playBtn">▶</button>
          <div class="error-msg" id="errorMsg"><p>Erro ao carregar vídeo</p><p id="errorDetails"></p></div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/hls.js@1.6.12/dist/hls.min.js"></script>
        <script>
          (function() {
            var video = document.getElementById('videoPlayer');
            var playBtn = document.getElementById('playBtn');
            var errorMsg = document.getElementById('errorMsg');
            var errorDetails = document.getElementById('errorDetails');
            var src = ${JSON.stringify(proxyVideoUrl)};

            function log(msg) {
              console.log('[VideoMobile]', msg);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'log', message: msg}));
              }
            }

            function showPlayButton() {
              playBtn.style.display = 'block';
              log('Mostrando botão play manual');
            }

            playBtn.addEventListener('click', function() {
              video.play().then(function() { playBtn.style.display = 'none'; log('Play manual funcionou!'); }).catch(function(e) { log('Erro no play manual: ' + e.message); });
            });

            if (window.Hls && Hls.isSupported()) {
              var hls = new Hls({ startLevel: -1, debug: false });
              hls.loadSource(src);
              hls.attachMedia(video);
              hls.on(Hls.Events.ERROR, function(event, data) {
                log('HLS error: ' + (data && data.reason ? data.reason : 'unknown'));
              });
              video.addEventListener('canplay', function() {
                log('Video canplay - tentando autoplay');
                video.play().then(function() { log('Autoplay OK'); }).catch(function(e) { log('Autoplay bloqueado: ' + e.message); showPlayButton(); });
              });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = src;
              video.addEventListener('canplay', function() {
                video.play().catch(function(e) { showPlayButton(); });
              });
            } else {
              log('HLS not supported');
              errorDetails.textContent = 'HLS não suportado neste navegador';
              errorMsg.style.display = 'block';
            }

            video.addEventListener('error', function() {
              var msg = video.error ? ('CODE: ' + video.error.code + ' - ' + video.error.message) : 'Unknown';
              log('ERRO VIDEO: ' + msg);
              errorDetails.textContent = msg;
              errorMsg.style.display = 'block';
            });
            video.addEventListener('playing', function() { playBtn.style.display = 'none'; });
            video.addEventListener('waiting', function() { log('Video buffering...'); });
          })();
        </script>
      </body>
      </html>`;

    return (
      <WebView
        source={{ html: mobileHtml }}
        style={{ flex: 1, minHeight: 240, backgroundColor: "#000" }}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        originWhitelist={["*"]}
        allowsBackForwardNavigationGestures={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "log") {
              console.log("📱 [WebView]", data.message);
            }
          } catch (e) {
            console.log("📱 [WebView]", event.nativeEvent.data);
          }
        }}
        renderLoading={() => (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#000",
            }}
          >
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={{ color: "white", marginTop: 10 }}>
              Carregando vídeo...
            </Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("❌ WebView error:", nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("❌ WebView HTTP error:", nativeEvent);
        }}
        onLoadEnd={() => {
          console.log("✅ WebView carregado");
        }}
      />
    );
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

  const extractVideoFromIframe = async (
    iframeSrc: string,
    episodeUrl: string,
  ): Promise<string | null> => {
    try {
      console.log("🔍 Tentando extrair vídeo do iframe:", iframeSrc);

      // Para iframes do Blogger, tentar extrair o token e construir URL direta
      if (iframeSrc.includes("blogger.com/video.g")) {
        const tokenMatch = iframeSrc.match(/token=([^&]+)/);
        if (tokenMatch) {
          const token = decodeURIComponent(tokenMatch[1]);
          console.log(
            "🔑 Token do Blogger encontrado:",
            token.substring(0, 50) + "...",
          );

          // Tentar diferentes padrões de URL do Blogger
          const possibleUrls = [
            `https://www.blogger.com/video.g?token=${token}`,
            `https://video.google.com/getvideobyid?token=${token}`,
            // Tentar extrair ID do token para outras URLs
          ];

          for (const url of possibleUrls) {
            try {
              console.log("🎯 Testando URL:", url);
              const response = await fetch(url, {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                  Referer: episodeUrl,
                },
              });

              if (response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("video")) {
                  console.log("✅ URL de vídeo encontrada:", url);
                  return url;
                }

                // Se não for vídeo direto, tentar extrair do HTML
                const html = await response.text();
                const videoUrlMatch = html.match(
                  /https:\/\/[^"'\s]*\.mp4[^"'\s]*/,
                );
                if (videoUrlMatch) {
                  console.log(
                    "✅ URL de vídeo extraída do HTML:",
                    videoUrlMatch[0],
                  );
                  return videoUrlMatch[0];
                }
              }
            } catch (error) {
              console.log(
                "❌ Falha ao testar URL:",
                url,
                getErrorMessage(error),
              );
              continue;
            }
          }
        }
      }

      // Para outros tipos de iframe, tentar acessar e procurar URLs de vídeo
      try {
        const response = await fetch(iframeSrc, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Referer: episodeUrl,
          },
        });

        if (response.ok) {
          const html = await response.text();

          // Procurar por padrões de URL de vídeo no HTML
          const videoPatterns = [
            /https:\/\/[^"'\s]*\.mp4[^"'\s]*/gi,
            /https:\/\/[^"'\s]*video[^"'\s]*/gi,
            /src=["']([^"']*\.(mp4|webm|avi|mov))["']/gi,
          ];

          for (const pattern of videoPatterns) {
            const matches = html.match(pattern);
            if (matches && matches.length > 0) {
              console.log("✅ URL de vídeo encontrada no iframe:", matches[0]);
              return matches[0];
            }
          }
        }
      } catch (error) {
        console.log("❌ Falha ao acessar iframe:", getErrorMessage(error));
      }

      console.log(
        "❌ Não foi possível extrair vídeo do iframe - VideoView não consegue reproduzir URLs de iframe",
      );
      // Não retornar iframe URL pois VideoView não consegue reproduzir
      return null;
    } catch (error) {
      console.error("Erro em extractVideoFromIframe:", error);
      return null;
    }
  };

  const resolveEpisodeUrl = () => {
    const rawUrl = Array.isArray(url) ? url[0] : url;
    const resolvedSlug = Array.isArray(slug) ? slug[0] : slug;
    const resolvedEpisode = Array.isArray(episode) ? episode[0] : episode;
    const decoded = rawUrl ? decodeURIComponent(String(rawUrl)) : "";

    if (!decoded || decoded === "#" || decoded === "undefined") {
      if (resolvedSlug && resolvedEpisode) {
        return `https://animefire.one/anime/${resolvedSlug}/episode-${resolvedEpisode}`;
      }
      return "";
    }

    try {
      const parsed = new URL(decoded);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return decoded;
      }
    } catch {
      // continua para fallback abaixo
    }

    if (resolvedSlug && resolvedEpisode) {
      return `https://animefire.one/anime/${resolvedSlug}/episode-${resolvedEpisode}`;
    }

    return decoded;
  };

  const extractVideoData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedAudio("default");

      const episodeUrl = resolveEpisodeUrl();
      if (!episodeUrl) {
        setError("URL do episódio inválida");
        setLoading(false);
        return;
      }

      // Usar endpoint correto do server TypeScript
      const effectiveApiBaseUrl = await getEffectiveApiBaseUrl();
      const response = await fetch(
        `${effectiveApiBaseUrl}/api/animefire/extractVideo?url=${encodeURIComponent(episodeUrl)}`,
      );
      if (!response.ok) {
        throw new Error(`Falha ao buscar o vídeo (${response.status})`);
      }
      const data = await response.json();

      console.log("🎬 Video extraction result:", data);

      if (data.error || !data.success) {
        console.warn(
          "🎬 fallback video activated because extraction failed:",
          data.error || "Falha ao extrair vídeo",
        );
        setError(data.error || "Falha ao extrair vídeo");
        setVideoData({
          videoUrl: fallbackVideoUrl,
          iframeSrc: null,
          allQualities: [],
          episodeUrl: episodeUrl,
          method: "fallback-video",
          originalVideoUrl: fallbackVideoUrl,
        });
        setSelectedSourceIndex(0);
      } else {
        const videoUrl = data.videoUrl || null;
        const iframeSrc = data.iframeSrc || null;
        const normalizedQualities = normalizeQualityList(
          data.allQualities || [],
        );

        if (normalizedQualities.length > 0) {
          const preferredAudio =
            normalizedQualities.find(
              (source: any) =>
                String(source.audio || "").toLowerCase() === "legendado",
            ) ||
            normalizedQualities.find(
              (source: any) =>
                String(source.audio || "").toLowerCase() === "dublado",
            ) ||
            normalizedQualities[0];
          setSelectedAudio(
            (preferredAudio?.audio || "default") === "legendado" ||
              (preferredAudio?.audio || "default") === "dublado"
              ? preferredAudio.audio
              : "default",
          );
        }

        if (iframeSrc && !videoUrl) {
          console.log(
            "📺 Apenas iframe encontrado, tentando extrair vídeo:",
            iframeSrc,
          );

          // Tentar extrair vídeo do iframe (especialmente Blogger)
          try {
            const extractedVideo = await extractVideoFromIframe(
              iframeSrc,
              episodeUrl,
            );
            if (extractedVideo) {
              console.log("✅ Vídeo extraído do iframe:", extractedVideo);
              // Se a URL extraída ainda for um iframe (blogger.com), usar WebView
              if (
                extractedVideo.includes("blogger.com") ||
                extractedVideo.includes("iframe")
              ) {
                console.log("📱 URL extraída ainda é iframe, usando WebView");
                setUseWebView(true);
                setVideoData({
                  videoUrl: null,
                  iframeSrc: extractedVideo,
                  allQualities: normalizedQualities,
                  episodeUrl: data.episodeUrl || episodeUrl,
                  method: "webview-iframe",
                  contentType:
                    data?.metadata?.accessibility?.contentType ||
                    "application/vnd.apple.mpegurl",
                });
                setSelectedSourceIndex(0);
              } else {
                // MOBILE: Forçar uso de iframe mesmo quando vídeo é extraído
                if (Platform.OS !== "web") {
                  console.log(
                    "📱 MOBILE detectado - Forçando iframe mesmo com vídeo extraído",
                  );
                  setUseWebView(true);
                  setVideoData({
                    videoUrl: null,
                    iframeSrc: iframeSrc,
                    allQualities: normalizedQualities,
                    episodeUrl: data.episodeUrl || episodeUrl,
                    method: "webview-iframe-mobile-forced",
                    contentType:
                      data?.metadata?.accessibility?.contentType ||
                      "application/vnd.apple.mpegurl",
                  });
                  setSelectedSourceIndex(0);
                } else {
                  console.log(
                    "🎬 URL de vídeo direta encontrada, usando VideoView",
                  );

                  // Usar URL direta - o WebVideoPlayer vai construir o proxy URL se necessário
                  setVideoData({
                    videoUrl: extractedVideo,
                    iframeSrc: iframeSrc,
                    allQualities: normalizedQualities,
                    episodeUrl: episodeUrl,
                    method: "iframe-extracted",
                    originalVideoUrl: extractedVideo,
                    contentType:
                      data?.metadata?.accessibility?.contentType ||
                      (extractedVideo.toLowerCase().includes("m3u8") ||
                      extractedVideo.toLowerCase().includes("h.jpg")
                        ? "application/vnd.apple.mpegurl"
                        : "video/mp4"),
                  });
                  setSelectedSourceIndex(0);
                }
              }
            } else {
              console.log("📱 Usando WebView para reproduzir iframe");
              setUseWebView(true);
              setVideoData({
                videoUrl: null,
                iframeSrc: iframeSrc,
                allQualities: normalizedQualities,
                episodeUrl: data.episodeUrl || episodeUrl,
                method: "webview-iframe",
                contentType:
                  data?.metadata?.accessibility?.contentType ||
                  "application/vnd.apple.mpegurl",
              });
              setSelectedSourceIndex(0);
            }
          } catch (error) {
            console.error("Erro ao extrair vídeo do iframe:", error);
            setError(
              "Vídeo disponível apenas via iframe (não suportado no app)",
            );
            setVideoData({
              videoUrl: null,
              iframeSrc: iframeSrc,
              allQualities: data.allQualities || [],
              episodeUrl: data.episodeUrl || episodeUrl,
              method: "iframe-only",
              contentType:
                data?.metadata?.accessibility?.contentType ||
                "application/vnd.apple.mpegurl",
            });
          }
        } else if (videoUrl) {
          console.log("✅ Usando videoUrl direto:", videoUrl);
          console.log("🎬 Episode URL para proxy:", episodeUrl);

          // MOBILE: Forçar uso de iframe para melhor compatibilidade
          if (Platform.OS !== "web" && iframeSrc) {
            console.log(
              "📱 MOBILE detectado - Forçando uso de iframe para compatibilidade",
            );
            setUseWebView(true);
            setVideoData({
              videoUrl: null,
              iframeSrc: iframeSrc,
              allQualities: normalizedQualities,
              episodeUrl: data.episodeUrl || episodeUrl,
              method: "webview-iframe-mobile",
              contentType:
                data?.metadata?.accessibility?.contentType ||
                "application/vnd.apple.mpegurl",
            });
            setSelectedSourceIndex(0);
          } else {
            // WEB: Usar URL direta - o WebVideoPlayer vai construir o proxy URL se necessário
            setVideoData({
              videoUrl: videoUrl,
              iframeSrc: iframeSrc || null,
              allQualities: normalizedQualities,
              episodeUrl: episodeUrl,
              method: data.method || "direct-video",
              originalVideoUrl: videoUrl,
              contentType:
                data?.metadata?.accessibility?.contentType ||
                (videoUrl.toLowerCase().includes("m3u8") ||
                videoUrl.toLowerCase().includes("h.jpg")
                  ? "application/vnd.apple.mpegurl"
                  : "video/mp4"),
            });
            setSelectedSourceIndex(0);
          }
        } else {
          setError("Nenhuma fonte de vídeo encontrada");
        }
      }

      // Mostrar anúncio se necessário
      console.log("🎯 Verificando se deve mostrar anúncio:", {
        episodeCount: frequencyData.episodeCount,
        shouldShow: shouldShowAd(),
        isWeb,
        isAdReady,
      });

      if (shouldShowAd()) {
        console.log("🚀 Mostrando anúncio!");
        setShowAd(true);
      } else {
        console.log("⏭️ Anúncio não necessário neste episódio");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error extracting video:", error);
      setError("Erro ao carregar vídeo");
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
    if (videoData?.allQualities && videoData.allQualities[index]) {
      const newVideoUrl = videoData.allQualities[index].src;
      const newAudio =
        String(videoData.allQualities[index].audio || "").trim() || "default";
      const label = videoData.allQualities[index].label;
      console.log("🎬 Switching to quality:", label, newAudio, newVideoUrl);

      setSelectedAudio(
        newAudio === "legendado" || newAudio === "dublado"
          ? newAudio
          : "default",
      );
      setVideoData((prev: any) => ({
        ...prev,
        videoUrl: newVideoUrl,
        originalVideoUrl: newVideoUrl,
        selectedAudio: newAudio,
      }));
    }
  };

  const audioOptions = resolveAudioOptions(videoData?.allQualities || []);
  const currentAudioLabel =
    audioOptions.find((option) => option.value === selectedAudio)?.label ||
    "Original";

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-white mt-4">Carregando episódio...</Text>
      </ScreenContainer>
    );
  }

  const currentVideoUrl = videoData?.videoUrl;
  const hasRealVideo =
    !!currentVideoUrl && !currentVideoUrl.includes("blogger.com");
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
          <View className="bg-black aspect-[4/3] max-h-64 relative overflow-hidden">
            {/* VÍDEO DIRETO (prioridade) - só se tiver videoUrl real */}
            {hasRealVideo ? (
              <WebVideoPlayer
                videoUrl={currentVideoUrl}
                title={`${slug} - Episódio ${episode}`}
                episodeUrl={videoData?.episodeUrl}
                contentType={
                  videoData?.contentType ||
                  videoData?.metadata?.accessibility?.contentType
                }
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
                  🔍 Vídeo extraído do iframe
                </Text>
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
                  ✅ Fonte: {videoData.method} | Qualidades:{" "}
                  {videoData.allQualities?.length || 1} | Áudio:{" "}
                  {currentAudioLabel}
                </Text>
                {videoData.method === "iframe-extracted" && (
                  <Text className="text-green-300 text-xs mt-1">
                    🔍 Vídeo extraído do iframe
                  </Text>
                )}
                {videoData.method === "iframe-extracted" &&
                  videoData.videoUrl?.includes("blogger.com") && (
                    <Text className="text-green-300 text-xs mt-1">
                      🎬 Usando iframe como vídeo (fallback)
                    </Text>
                  )}
                {videoData.method === "webview-iframe" && (
                  <Text className="text-green-300 text-xs mt-1">
                    🌐 Reproduzindo via WebView (iframe)
                  </Text>
                )}
                {videoData.method === "direct-video" &&
                  videoData.originalVideoUrl && (
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
                <Text className="text-white text-sm font-semibold mb-2">
                  Áudio:
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {audioOptions.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => {
                        const matchIndex = videoData.allQualities.findIndex(
                          (source: any) =>
                            String(source.audio || "").toLowerCase() ===
                            option.value,
                        );
                        if (matchIndex >= 0) {
                          setSelectedAudio(
                            option.value as "legendado" | "dublado" | "default",
                          );
                          handleSelectSource(matchIndex);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg ${
                        selectedAudio === option.value
                          ? "bg-primary"
                          : "bg-surface border border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${selectedAudio === option.value ? "text-white" : "text-foreground"}`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text className="text-white text-sm font-semibold mb-2">
                  Qualidade:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-2"
                >
                  {videoData.allQualities
                    .slice()
                    .sort(
                      (a: any, b: any) =>
                        parseQualityValue(b.label) - parseQualityValue(a.label),
                    )
                    .map((source: any) => {
                      const targetIndex = videoData.allQualities.findIndex(
                        (item: any) =>
                          item.label === source.label &&
                          String(item.audio || "").toLowerCase() ===
                            String(source.audio || "").toLowerCase(),
                      );

                      return (
                        <TouchableOpacity
                          key={`${source.audio || "default"}-${source.label}`}
                          onPress={() => {
                            if (targetIndex >= 0) {
                              handleSelectSource(targetIndex);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg ${
                            selectedSourceIndex === targetIndex
                              ? "bg-primary"
                              : "bg-surface border border-border"
                          }`}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              selectedSourceIndex === targetIndex
                                ? "text-white"
                                : "text-foreground"
                            }`}
                          >
                            {source.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
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

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface WebInterstitialAdProps {
  adClient: string;
  adSlot: string;
  onAdClosed: () => void;
}

/**
 * Componente para exibir anúncios interstitial do AdSense na web
 * Simula um modal de anúncio com botão para fechar
 */
export function WebInterstitialAd({ adClient, adSlot, onAdClosed }: WebInterstitialAdProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [adLoaded, setAdLoaded] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const MIN_DISPLAY_TIME = 3000; // 3 segundos mínimos

  useEffect(() => {
    // Simular carregamento do anúncio
    const loadTimer = setTimeout(() => {
      setAdLoaded(true);
      console.log("WebInterstitialAd loaded successfully");
    }, 1000);

    // Timer para tempo mínimo de exibição
    const displayTimer = setInterval(() => {
      setDisplayTime((prev) => prev + 100);
    }, 100);

    return () => {
      clearTimeout(loadTimer);
      clearInterval(displayTimer);
    };
  }, []);

  const canClose = displayTime >= MIN_DISPLAY_TIME && adLoaded;

  const handleClose = () => {
    if (canClose) {
      setIsVisible(false);
      onAdClosed();
    }
  };

  if (!isVisible) return null;

  return (
    <View
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 10,
          maxWidth: 400,
          width: "90%",
          alignItems: "center",
        }}
      >
        {!adLoaded ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: "#666", marginBottom: 10 }}>
              Carregando anúncio...
            </Text>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 3,
                borderColor: "#7C3AED",
                borderTopColor: "transparent",
                animation: "spin 1s linear infinite",
              }}
            />
          </View>
        ) : (
          <View style={{ width: "100%", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#333" }}>
              Anúncio Publicitário
            </Text>
            
            {/* Espaço para o anúncio AdSense */}
            <View
              style={{
                width: 300,
                height: 250,
                backgroundColor: "#f0f0f0",
                borderRadius: 5,
                marginBottom: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #ddd",
              }}
            >
              <Text style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
                Espaço para anúncio AdSense
              </Text>
              <Text style={{ fontSize: 12, color: "#999", marginTop: 5 }}>
                Client: {adClient}
              </Text>
              <Text style={{ fontSize: 12, color: "#999" }}>
                Slot: {adSlot}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              disabled={!canClose}
              style={{
                backgroundColor: canClose ? "#7C3AED" : "#ccc",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
                {canClose ? "Fechar Anúncio" : `Aguarde ${Math.ceil((MIN_DISPLAY_TIME - displayTime) / 1000)}s`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Adicionar CSS para animação */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </View>
  );
}
import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { WebInterstitialAd } from "./web-ads";

interface AdModalProps {
  visible: boolean;
  onClose: () => void;
  isLoading?: boolean;
  interstitial?: any;
  isWeb?: boolean;
}

/**
 * Componente modal para exibir anúncios interstitial
 * Mostra um placeholder enquanto o anúncio está carregando
 */
export function AdModal({ visible, onClose, isLoading = false, interstitial, isWeb = false }: AdModalProps) {
  const colors = useColors();
  const [displayTime, setDisplayTime] = useState(0);
  const MIN_DISPLAY_TIME = 3000; // Mínimo 3 segundos

  useEffect(() => {
    if (visible) {
      setDisplayTime(0);
      const timer = setInterval(() => {
        setDisplayTime((prev) => prev + 100);
      }, 100);

      return () => clearInterval(timer);
    }
  }, [visible]);

  const canClose = displayTime >= MIN_DISPLAY_TIME && !isLoading;

  const handleClose = () => {
    if (canClose) {
      onClose();
    }
  };

  // Para web, usar componente WebInterstitialAd
  if (isWeb) {
    return (
      <WebInterstitialAd
        onAdClosed={onClose}
        adClient="ca-pub-7213751684524160" // Seu AdSense Client ID
        adSlot="8919461756" // Seu AdSense Slot ID
      />
    );
  }

  // Para mobile, usar modal original
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Ad Container */}
        <View
          style={{
            width: "90%",
            aspectRatio: 9 / 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={{
                  marginTop: 16,
                  color: colors.muted,
                  fontSize: 14,
                }}
              >
                Carregando anúncio...
              </Text>
            </>
          ) : (
            <>
              {/* Anúncio real do AdMob */}
              {interstitial && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 16,
                      marginBottom: 16,
                    }}
                  >
                    Anúncio carregado com sucesso!
                  </Text>
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 12,
                      textAlign: "center",
                      marginHorizontal: 16,
                      marginBottom: 32,
                    }}
                  >
                    O anúncio será exibido em tela cheia automaticamente
                  </Text>
                </View>
              )}

              {/* Close Button */}
              <TouchableOpacity
                onPress={handleClose}
                disabled={!canClose}
                style={{
                  backgroundColor: canClose ? colors.primary : colors.muted,
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                  borderRadius: 8,
                  opacity: canClose ? 1 : 0.5,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {canClose ? "Fechar" : `Aguarde ${Math.ceil((MIN_DISPLAY_TIME - displayTime) / 1000)}s`}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Skip Ad Text */}
        {canClose && (
          <Text
            style={{
              color: colors.muted,
              fontSize: 12,
              marginTop: 24,
            }}
          >
            Você pode pular este anúncio
          </Text>
        )}
      </View>
    </Modal>
  );
}

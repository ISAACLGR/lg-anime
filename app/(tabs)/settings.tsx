import { ScrollView, Text, View, TouchableOpacity, Switch, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");
  const [videoQuality, setVideoQuality] = useState("720p");
  const [notifications, setNotifications] = useState(true);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Save to AsyncStorage and update theme
  };

  const handleClearCache = () => {
    Alert.alert(
      "Limpar Cache",
      "Tem certeza que deseja limpar o cache de imagens?",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Limpar",
          onPress: () => {
            // TODO: Clear cache from AsyncStorage
            Alert.alert("Sucesso", "Cache limpo com sucesso!");
          },
          style: "destructive",
        },
      ]
    );
  };

  const SettingItem = ({
    title,
    subtitle,
    onPress,
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between p-4 border-b border-border"
    >
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {subtitle && <Text className="text-sm text-muted mt-1">{subtitle}</Text>}
      </View>
      <Text className="text-primary text-lg">›</Text>
    </TouchableOpacity>
  );

  const ToggleSetting = ({
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View className="flex-row items-center justify-between p-4 border-b border-border">
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {subtitle && <Text className="text-sm text-muted mt-1">{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#767577", true: "#7C3AED" }}
        thumbColor={value ? "#FFFFFF" : "#f4f3f4"}
      />
    </View>
  );

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-4 bg-gradient-to-r from-primary to-pink-500">
          <Text className="text-2xl font-bold text-white">Configurações</Text>
        </View>

        {/* Appearance Section */}
        <View>
          <Text className="text-sm font-bold text-primary px-4 py-3 bg-surface/50">
            APARÊNCIA
          </Text>
          <ToggleSetting
            title="Modo Escuro"
            subtitle="Ativa o tema escuro do aplicativo"
            value={isDarkMode}
            onValueChange={handleThemeToggle}
          />
        </View>

        {/* Video Section */}
        <View>
          <Text className="text-sm font-bold text-primary px-4 py-3 bg-surface/50 mt-2">
            VÍDEO
          </Text>
          <SettingItem
            title="Qualidade de Vídeo"
            subtitle={`Qualidade padrão: ${videoQuality}`}
            onPress={() => {
              Alert.alert(
                "Qualidade de Vídeo",
                "Selecione a qualidade padrão",
                [
                  {
                    text: "480p",
                    onPress: () => setVideoQuality("480p"),
                  },
                  {
                    text: "720p",
                    onPress: () => setVideoQuality("720p"),
                  },
                  {
                    text: "1080p",
                    onPress: () => setVideoQuality("1080p"),
                  },
                  { text: "Cancelar", style: "cancel" },
                ]
              );
            }}
          />
          <ToggleSetting
            title="Notificações"
            subtitle="Receba notificações de novos episódios"
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        {/* Storage Section */}
        <View>
          <Text className="text-sm font-bold text-primary px-4 py-3 bg-surface/50 mt-2">
            ARMAZENAMENTO
          </Text>
          <SettingItem
            title="Limpar Cache"
            subtitle="Remove imagens em cache"
            onPress={handleClearCache}
          />
        </View>

        {/* About Section */}
        <View>
          <Text className="text-sm font-bold text-primary px-4 py-3 bg-surface/50 mt-2">
            SOBRE
          </Text>
          <SettingItem title="Versão" subtitle="1.0.0" />
          <SettingItem
            title="Sobre o AnimeFire"
            subtitle="Aplicativo de streaming de anime"
          />
          <SettingItem
            title="Termos de Serviço"
            subtitle="Leia nossos termos e condições"
          />
          <SettingItem
            title="Privacidade"
            subtitle="Política de privacidade"
          />
        </View>

        {/* Footer */}
        <View className="px-4 py-6 items-center">
          <Text className="text-sm text-muted text-center">
            AnimeFire © 2026
          </Text>
          <Text className="text-xs text-muted text-center mt-2">
            Desenvolvido com amor para os fãs de anime
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

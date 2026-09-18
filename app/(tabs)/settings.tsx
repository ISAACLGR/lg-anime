import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from "react-native";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useThemeContext } from "@/lib/theme-provider";
import {
  DEFAULT_APP_SETTINGS,
  getAppSettings,
  saveAppSettings,
  type AppSettings,
} from "@/lib/runtime-settings";

export default function SettingsScreen() {
  const { setColorScheme } = useThemeContext();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await getAppSettings();
      setSettings(saved);
      setColorScheme(saved.darkMode ? "dark" : "light");
      setIsLoading(false);
    };

    loadSettings();
  }, [setColorScheme]);

  const persistSettings = async (partial: Partial<AppSettings>) => {
    const next = await saveAppSettings(partial);
    setSettings(next);
    if (partial.darkMode !== undefined) {
      setColorScheme(next.darkMode ? "dark" : "light");
    }
  };

  const handleThemeToggle = (value: boolean) => {
    persistSettings({ darkMode: value });
  };

  const handleClearCache = () => {
    Alert.alert(
      "Limpar Cache",
      "Tem certeza que deseja limpar o cache de imagens?",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Limpar",
          onPress: async () => {
            try {
              await saveAppSettings({ videoQuality: DEFAULT_APP_SETTINGS.videoQuality });
              setSettings((current) => ({
                ...current,
                videoQuality: DEFAULT_APP_SETTINGS.videoQuality,
              }));
              Alert.alert("Sucesso", "Cache limpo com sucesso!");
            } catch (error) {
              console.error("Erro ao limpar cache:", error);
              Alert.alert("Erro", "Não foi possível limpar o cache.");
            }
          },
          style: "destructive",
        },
      ],
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

  const InputField = ({
    label,
    value,
    onChangeText,
  }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
  }) => (
    <View className="px-4 py-3 border-b border-border">
      <Text className="text-sm font-semibold text-primary">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#8B8B8B"
        className="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
      />
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Carregando configurações...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4 bg-gradient-to-r from-primary to-pink-500">
          <Text className="text-2xl font-bold text-white">Configurações</Text>
        </View>

        <View>
          <Text className="text-sm font-bold text-primary px-4 py-3 bg-surface/50">
            APARÊNCIA
          </Text>
          <ToggleSetting
            title="Modo Escuro"
            subtitle="Ativa o tema escuro do aplicativo"
            value={settings.darkMode}
            onValueChange={handleThemeToggle}
          />
        </View>

        <View>
          <Text className="text-sm font-bold text-primary px-4 py-3 bg-surface/50 mt-2">
            CONEXÃO
          </Text>
          <InputField
            label="API Base URL"
            value={settings.apiBaseUrl}
            onChangeText={(apiBaseUrl) => setSettings((current) => ({ ...current, apiBaseUrl }))}
          />
          <InputField
            label="OAuth Server URL"
            value={settings.oauthServerUrl}
            onChangeText={(oauthServerUrl) => setSettings((current) => ({ ...current, oauthServerUrl }))}
          />
          <TouchableOpacity
            className="mx-4 my-3 rounded-xl bg-primary px-4 py-3"
            onPress={async () => {
              const next = await saveAppSettings({
                apiBaseUrl: settings.apiBaseUrl,
                oauthServerUrl: settings.oauthServerUrl,
                useScraperApi: settings.useScraperApi,
                cacheEnabled: settings.cacheEnabled,
                cacheTtlMs: settings.cacheTtlMs,
              });
              setSettings(next);
              Alert.alert("Sucesso", "Configurações salvas localmente.");
            }}
          >
            <Text className="text-center text-base font-semibold text-white">
              Salvar configuração
            </Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text className="text-sm font-bold text-primary px-4 py-3 bg-surface/50 mt-2">
            VÍDEO
          </Text>
          <SettingItem
            title="Qualidade de Vídeo"
            subtitle={`Qualidade padrão: ${settings.videoQuality}`}
            onPress={() => {
              Alert.alert(
                "Qualidade de Vídeo",
                "Selecione a qualidade padrão",
                [
                  {
                    text: "480p",
                    onPress: async () => {
                      await persistSettings({ videoQuality: "480p" });
                    },
                  },
                  {
                    text: "720p",
                    onPress: async () => {
                      await persistSettings({ videoQuality: "720p" });
                    },
                  },
                  {
                    text: "1080p",
                    onPress: async () => {
                      await persistSettings({ videoQuality: "1080p" });
                    },
                  },
                  { text: "Cancelar", style: "cancel" },
                ],
              );
            }}
          />
          <ToggleSetting
            title="Notificações"
            subtitle="Receba notificações de novos episódios"
            value={settings.notifications}
            onValueChange={(value) => persistSettings({ notifications: value })}
          />
          <ToggleSetting
            title="Usar Scraper API"
            subtitle="Ativa a utilização do Scraper API para extração"
            value={settings.useScraperApi}
            onValueChange={(value) => persistSettings({ useScraperApi: value })}
          />
          <ToggleSetting
            title="Cache habilitado"
            subtitle="Ativa a camada de cache do app"
            value={settings.cacheEnabled}
            onValueChange={(value) => persistSettings({ cacheEnabled: value })}
          />
          <InputField
            label="TTL do Cache (ms)"
            value={String(settings.cacheTtlMs)}
            onChangeText={(value) =>
              setSettings((current) => ({
                ...current,
                cacheTtlMs: Number(value) || 0,
              }))
            }
          />
        </View>

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

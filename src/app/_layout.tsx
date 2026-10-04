import { EBGaramond_500Medium } from "@expo-google-fonts/eb-garamond/500Medium";
import { EBGaramond_500Medium_Italic } from "@expo-google-fonts/eb-garamond/500Medium_Italic";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ContentProvider } from "@/lib/content";
import { LanguageProvider } from "@/lib/i18n";
import { PlayerProvider } from "@/lib/player";
import { usePalette } from "@/lib/theme";

void SplashScreen.preventAutoHideAsync();

function Navigator() {
  const palette = usePalette();
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: palette.ink,
          headerStyle: { backgroundColor: palette.page },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: { fontFamily: "Inter_700Bold", fontSize: 15 },
          contentStyle: { backgroundColor: palette.page },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="song/[slug]" options={{ title: "" }} />
        <Stack.Screen name="video/[id]" options={{ title: "", headerStyle: { backgroundColor: palette.dark }, headerTintColor: "#fff" }} />
        <Stack.Screen name="update/[slug]" options={{ title: "" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, failed] = useFonts({
    EBGaramond_500Medium,
    EBGaramond_500Medium_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || failed) void SplashScreen.hideAsync();
  }, [loaded, failed]);

  // The splash stays up for the fraction of a second the fonts take, so the
  // first frame is already in the choir's type.
  if (!loaded && !failed) return null;

  return (
    <SafeAreaProvider>
      <ContentProvider>
        <LanguageProvider>
          <PlayerProvider>
            <Navigator />
          </PlayerProvider>
        </LanguageProvider>
      </ContentProvider>
    </SafeAreaProvider>
  );
}

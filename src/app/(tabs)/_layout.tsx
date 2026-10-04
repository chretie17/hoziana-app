import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import type { IconName } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";
import { fonts, usePalette } from "@/lib/theme";

const icons: Record<string, [IconName, IconName]> = {
  index: ["home", "home-outline"],
  songs: ["book", "book-outline"],
  listen: ["play-circle", "play-circle-outline"],
  updates: ["newspaper", "newspaper-outline"],
  story: ["people", "people-outline"],
};

export default function TabLayout() {
  const { t } = useLanguage();
  const palette = usePalette();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.accentDeep,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: palette.line },
        tabBarLabelStyle: { fontFamily: fonts.textMedium, fontSize: 11, lineHeight: 14 },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, idle] = icons[route.name] ?? ["ellipse", "ellipse-outline"];
          return <Ionicons name={focused ? active : idle} size={size - 2} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: t.tabs.home }} />
      <Tabs.Screen name="songs" options={{ title: t.tabs.songs }} />
      <Tabs.Screen name="listen" options={{ title: t.tabs.listen }} />
      <Tabs.Screen name="updates" options={{ title: t.tabs.updates }} />
      <Tabs.Screen name="story" options={{ title: t.tabs.story }} />
    </Tabs>
  );
}

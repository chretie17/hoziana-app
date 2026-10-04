import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { usePlayer } from "@/lib/player";
import { fonts, usePalette } from "@/lib/theme";

/** The song that is playing, docked under every page while it plays. */
export function MiniPlayer() {
  const { track, status, toggle, stop } = usePlayer();
  const { t } = useLanguage();
  const palette = usePalette();
  const logo = useContent().content.brand.logoUrl;
  if (!track) return null;

  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  return (
    <View style={[styles.bar, { backgroundColor: palette.dark }]}>
      <View style={[styles.progress, { width: `${progress * 100}%`, backgroundColor: palette.accent }]} />
      <Pressable
        style={styles.main}
        onPress={() => router.push({ pathname: "/song/[slug]", params: { slug: track.slug } })}
        accessibilityRole="button"
        accessibilityLabel={track.title}
      >
        <Image source={logo} style={styles.art} contentFit="cover" />
        <View style={styles.text}>
          <Text numberOfLines={1} style={styles.title}>{track.title}</Text>
          <Text style={[styles.state, { color: palette.accentSoft }]}>{status.playing ? t.playing : t.paused}</Text>
        </View>
      </Pressable>
      <Pressable onPress={() => toggle(track)} hitSlop={8} style={[styles.round, { backgroundColor: palette.accent }]} accessibilityRole="button" accessibilityLabel={status.playing ? t.paused : t.playing}>
        <Ionicons name={status.playing ? "pause" : "play"} size={20} color={palette.dark} style={status.playing ? undefined : styles.playNudge} />
      </Pressable>
      <Pressable onPress={stop} hitSlop={10} style={styles.close} accessibilityRole="button" accessibilityLabel={t.close}>
        <Ionicons name="close" size={20} color="#ffffffaa" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 12, paddingRight: 8, paddingVertical: 9, overflow: "hidden" },
  progress: { position: "absolute", top: 0, left: 0, height: 2 },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 11 },
  art: { width: 40, height: 40, borderRadius: 20 },
  text: { flex: 1 },
  title: { color: "#fff", fontFamily: fonts.textBold, fontSize: 14 },
  state: { fontFamily: fonts.text, fontSize: 12, marginTop: 2 },
  round: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  playNudge: { marginLeft: 3 },
  close: { width: 36, height: 42, alignItems: "center", justifyContent: "center" },
});

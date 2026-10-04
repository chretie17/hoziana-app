import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MiniPlayer } from "@/components/MiniPlayer";
import { useContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { fonts, usePalette } from "@/lib/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Every page: the page colour behind it, the phone's notch kept clear at the
 * top, and the song that is playing docked at the bottom.
 */
export function Screen({ children, dark = false, edges = ["top"] }: { children: ReactNode; dark?: boolean; edges?: ("top" | "bottom")[] }) {
  const palette = usePalette();
  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: dark ? palette.dark : palette.page }]}>
      <View style={styles.body}>{children}</View>
      <MiniPlayer />
    </SafeAreaView>
  );
}

/** The small capitals above a heading, as on the website. */
export function Kicker({ children, light = false, style }: { children: ReactNode; light?: boolean; style?: StyleProp<TextStyle> }) {
  const palette = usePalette();
  return <Text style={[styles.kicker, { color: light ? palette.accent : palette.accentDeep }, style]}>{children}</Text>;
}

export function Heading({ children, light = false, size = 34, style }: { children: ReactNode; light?: boolean; size?: number; style?: StyleProp<TextStyle> }) {
  const palette = usePalette();
  return (
    <Text style={[styles.heading, { fontSize: size, lineHeight: Math.round(size * 1.12), color: light ? palette.onDark : palette.ink }, style]}>
      {children}
    </Text>
  );
}

export function Body({ children, light = false, muted = false, style, numberOfLines }: { children: ReactNode; light?: boolean; muted?: boolean; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const palette = usePalette();
  const color = light ? (muted ? palette.onDarkMuted : palette.onDark) : muted ? palette.muted : palette.ink;
  return <Text numberOfLines={numberOfLines} style={[styles.bodyText, { color }, style]}>{children}</Text>;
}

/** Offline, or a website newer than this copy of the app. Silent otherwise. */
export function StatusNote() {
  const { status } = useContent();
  const { t } = useLanguage();
  const palette = usePalette();
  if (status !== "offline" && status !== "outdated-app") return null;
  return (
    <View style={[styles.note, { backgroundColor: palette.sand, borderColor: palette.line }]}>
      <Ionicons name={status === "offline" ? "cloud-offline-outline" : "arrow-up-circle-outline"} size={16} color={palette.accentDeep} />
      <Text style={[styles.noteText, { color: palette.ink }]}>{status === "offline" ? t.offline : t.outdatedApp}</Text>
    </View>
  );
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const palette = usePalette();
  return (
    <View style={[styles.search, { backgroundColor: palette.card, borderColor: palette.line }]}>
      <Ionicons name="search" size={18} color={palette.muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        style={[styles.searchInput, { color: palette.ink }]}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange("")} hitSlop={12} accessibilityRole="button" accessibilityLabel="Clear">
          <Ionicons name="close-circle" size={18} color={palette.muted} />
        </Pressable>
      )}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, { borderColor: active ? palette.accentDeep : palette.line, backgroundColor: active ? palette.accentDeep : palette.card }]}
    >
      <Text style={[styles.chipText, { color: active ? "#fff" : palette.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Button({ label, icon, onPress, tone = "accent", style }: { label: string; icon?: IconName; onPress: () => void; tone?: "accent" | "dark" | "outline"; style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  const background = tone === "accent" ? palette.accent : tone === "dark" ? palette.dark : "transparent";
  const color = tone === "accent" ? palette.dark : tone === "dark" ? "#fff" : palette.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, { backgroundColor: background, borderColor: tone === "outline" ? palette.line : background, opacity: pressed ? 0.8 : 1 }, style]}
    >
      {icon && <Ionicons name={icon} size={17} color={color} />}
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const palette = usePalette();
  return (
    <View style={styles.sectionHeader}>
      <Heading size={26}>{title}</Heading>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link">
          <Text style={[styles.sectionAction, { color: palette.accentDeep }]}>{action} →</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
  kicker: { fontFamily: fonts.textBold, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase" },
  heading: { fontFamily: fonts.display, letterSpacing: -0.3 },
  bodyText: { fontFamily: fonts.text, fontSize: 15, lineHeight: 23 },
  note: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderRadius: 10 },
  noteText: { flex: 1, fontFamily: fonts.textMedium, fontSize: 12.5 },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 48, paddingHorizontal: 14, borderWidth: 1, borderRadius: 12 },
  searchInput: { flex: 1, height: "100%", fontFamily: fonts.text, fontSize: 15 },
  chip: { height: 36, paddingHorizontal: 15, justifyContent: "center", borderWidth: 1, borderRadius: 18 },
  chipText: { fontFamily: fonts.textMedium, fontSize: 13 },
  button: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingHorizontal: 20, borderWidth: 1, borderRadius: 12 },
  buttonText: { fontFamily: fonts.textBold, fontSize: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14 },
  sectionAction: { fontFamily: fonts.textBold, fontSize: 13 },
});

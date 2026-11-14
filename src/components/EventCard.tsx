import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { dateBadge, formatRange, formatTime, isHappening } from "@/lib/events";
import { useLanguage } from "@/lib/i18n";
import { fonts, usePalette } from "@/lib/theme";
import type { ChoirEvent } from "@/lib/types";

export function openEvent(id: string) {
  router.push({ pathname: "/event/[id]", params: { id } });
}

/**
 * A gathering at a glance: its date as a badge, its name, when and where.
 * `large` adds the picture, for the next event on Home.
 */
export function EventCard({ event, large = false }: { event: ChoirEvent; large?: boolean }) {
  const { t, language, pick } = useLanguage();
  const palette = usePalette();
  const [day, month] = dateBadge(event.start, language);
  const now = isHappening(event);
  const subtitle = pick(event.subtitle);

  return (
    <Pressable
      onPress={() => openEvent(event.id)}
      style={({ pressed }) => [styles.card, { backgroundColor: palette.card, borderColor: palette.line }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${formatRange(event, language)}`}
    >
      {large && event.imageUrl ? <Image source={event.imageUrl} style={styles.image} contentFit="cover" transition={200} /> : null}
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: now ? palette.accentDeep : palette.sand }]}>
          <Text style={[styles.badgeDay, { color: now ? "#fff" : palette.accentDeep }]}>{day}</Text>
          <Text numberOfLines={1} style={[styles.badgeMonth, { color: now ? "#ffffffcc" : palette.accentDeep }]}>{month}</Text>
        </View>
        <View style={styles.text}>
          {now ? <Text style={[styles.now, { color: palette.accentDeep }]}>{t.happeningNow}</Text> : null}
          <Text numberOfLines={2} style={[styles.title, { color: palette.ink }]}>{event.title}</Text>
          {subtitle ? <Text numberOfLines={2} style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</Text> : null}
          {event.start !== event.end ? (
            <View style={styles.meta}>
              <Ionicons name="calendar-outline" size={14} color={palette.muted} />
              <Text numberOfLines={1} style={[styles.metaText, { color: palette.muted }]}>{formatRange(event, language)}</Text>
            </View>
          ) : null}
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={14} color={palette.muted} />
            <Text numberOfLines={1} style={[styles.metaText, { color: palette.muted }]}>{formatTime(event, language)}</Text>
          </View>
          {event.location ? (
            <View style={styles.meta}>
              <Ionicons name="location-outline" size={14} color={palette.muted} />
              <Text numberOfLines={1} style={[styles.metaText, { color: palette.muted }]}>{event.location}</Text>
            </View>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.muted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  image: { width: "100%", aspectRatio: 16 / 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  badge: { width: 58, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  badgeDay: { fontFamily: fonts.display, fontSize: 28, lineHeight: 30 },
  badgeMonth: { fontFamily: fonts.textBold, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" },
  text: { flex: 1, gap: 3 },
  now: { fontFamily: fonts.textBold, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" },
  title: { fontFamily: fonts.display, fontSize: 21, lineHeight: 25 },
  subtitle: { fontFamily: fonts.text, fontSize: 13.5, lineHeight: 19 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  metaText: { flex: 1, fontFamily: fonts.textMedium, fontSize: 13 },
});

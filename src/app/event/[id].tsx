import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";

import { Body, Button, Heading, Kicker, Screen, type IconName } from "@/components/ui";
import { useContent } from "@/lib/content";
import { addToCalendar, formatRange, formatTime, isHappening } from "@/lib/events";
import { useLanguage } from "@/lib/i18n";
import { fonts, usePalette } from "@/lib/theme";
import { openWebsite } from "@/lib/website";

/**
 * One gathering: its picture, when and where, what it is about, and a button
 * that puts it in the phone's calendar.
 */
export default function EventPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { content } = useContent();
  const { t, language, pick } = useLanguage();
  const palette = usePalette();
  const event = (content.events ?? []).find((entry) => entry.id === id);

  if (!event) {
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title: "" }} />
        <View style={styles.missing}><Body muted>{t.eventNotFound}</Body></View>
      </Screen>
    );
  }

  const subtitle = pick(event.subtitle);
  const paragraphs = pick(event.description).split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const now = isHappening(event);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: t.upcomingEvents }} />
      <ScrollView contentContainerStyle={styles.content}>
        {event.imageUrl ? (
          <Image source={event.imageUrl} style={styles.image} contentFit="cover" transition={200} accessibilityLabel={event.title} />
        ) : null}

        <View style={styles.head}>
          <Kicker>{now ? t.happeningNow : formatRange(event, language)}</Kicker>
          <Heading size={34} style={styles.title}>{event.title}</Heading>
          {subtitle ? <Body muted>{subtitle}</Body> : null}
        </View>

        <View style={[styles.facts, { backgroundColor: palette.card, borderColor: palette.line }]}>
          <Fact icon="calendar-outline" label={t.eventWhen} value={formatRange(event, language)} first />
          <Fact icon="time-outline" label={t.eventTime} value={formatTime(event, language)} />
          {event.location ? (
            <Fact
              icon="location-outline"
              label={t.eventWhere}
              value={event.location}
              action={t.openInMaps}
              onAction={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`)}
            />
          ) : null}
        </View>

        <Button label={t.addToCalendar} icon="calendar" onPress={() => void addToCalendar(event, language)} style={styles.calendar} />

        {paragraphs.length > 0 ? (
          <View style={styles.about}>
            <Heading size={24}>{t.aboutEvent}</Heading>
            {paragraphs.map((paragraph, index) => <Body key={index}>{paragraph}</Body>)}
          </View>
        ) : null}

        <View style={styles.links}>
          <Button label={t.readOnWebsite} icon="open-outline" tone="outline" onPress={() => void openWebsite(`/events/${event.id}`, palette.accentDeep)} />
          {event.link ? (
            <Button label={t.originalAnnouncement} icon="megaphone-outline" tone="outline" onPress={() => void Linking.openURL(event.link)} />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Fact({ icon, label, value, first = false, action, onAction }: { icon: IconName; label: string; value: string; first?: boolean; action?: string; onAction?: () => void }) {
  const palette = usePalette();
  return (
    <View style={[styles.fact, !first && { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.factIcon, { backgroundColor: palette.sand }]}>
        <Ionicons name={icon} size={20} color={palette.accentDeep} />
      </View>
      <View style={styles.factText}>
        <Text style={[styles.factLabel, { color: palette.muted }]}>{label}</Text>
        <Text style={[styles.factValue, { color: palette.ink }]}>{value}</Text>
        {action && onAction ? (
          <Text onPress={onAction} accessibilityRole="link" style={[styles.factAction, { color: palette.accentDeep }]}>{action} →</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  missing: { padding: 24 },
  image: { width: "100%", aspectRatio: 16 / 10 },
  head: { paddingHorizontal: 16, paddingTop: 18, gap: 6 },
  title: { marginTop: 2 },
  facts: { marginHorizontal: 16, marginTop: 18, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  fact: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  factIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  factText: { flex: 1, gap: 2 },
  factLabel: { fontFamily: fonts.textBold, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" },
  factValue: { fontFamily: fonts.textMedium, fontSize: 16, lineHeight: 22 },
  factAction: { fontFamily: fonts.textBold, fontSize: 13, marginTop: 4 },
  calendar: { marginHorizontal: 16, marginTop: 16 },
  about: { paddingHorizontal: 16, marginTop: 26, gap: 10 },
  links: { paddingHorizontal: 16, marginTop: 22, gap: 10 },
});

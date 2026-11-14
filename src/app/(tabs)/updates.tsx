import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { EventCard } from "@/components/EventCard";
import { Body, Heading, Kicker, Screen, StatusNote } from "@/components/ui";
import { useContent } from "@/lib/content";
import { upcomingEvents } from "@/lib/events";
import { formatDate, useLanguage } from "@/lib/i18n";
import { fonts, usePalette } from "@/lib/theme";
import { openWebsite } from "@/lib/website";

export default function Updates() {
  const { content, status, refresh } = useContent();
  const { t, language, pick } = useLanguage();
  const palette = usePalette();
  const events = upcomingEvents(content.events);

  return (
    <Screen>
      <FlatList
        data={content.updates}
        keyExtractor={(post) => String(post.id)}
        refreshControl={<RefreshControl refreshing={status === "checking"} onRefresh={() => void refresh()} tintColor={palette.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Kicker>{content.brand.name}</Kicker>
            <Heading size={36} style={styles.title}>{t.tabs.updates}</Heading>
            <StatusNote />
            {events.length > 0 ? (
              <View style={styles.events}>
                <Kicker>{t.upcomingEvents}</Kicker>
                {events.map((event) => <EventCard key={event.id} event={event} />)}
                <Kicker style={styles.newsKicker}>{t.latestNews}</Kicker>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={<Body muted style={styles.empty}>{t.noUpdates}</Body>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => void openWebsite(`/updates/${item.slug}`, palette.accentDeep)}
            style={({ pressed }) => [styles.card, { backgroundColor: palette.card, borderColor: palette.line, opacity: pressed ? 0.85 : 1 }]}
            accessibilityRole="link"
          >
            {item.imageUrl ? <Image source={item.imageUrl} accessibilityLabel={item.imageAlt} style={styles.image} contentFit="cover" transition={200} /> : null}
            <View style={styles.body}>
              <Kicker>{t.categories[item.category] ?? item.category} · {formatDate(item.publishedOn, language)}</Kicker>
              <Text style={[styles.cardTitle, { color: palette.ink }]}>{pick(item.title)}</Text>
              <Body muted numberOfLines={3}>{pick(item.excerpt)}</Body>
              <View style={styles.moreRow}>
                <Text style={[styles.more, { color: palette.accentDeep }]}>{t.readOnWebsite}</Text>
                <Ionicons name="open-outline" size={15} color={palette.accentDeep} />
              </View>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  header: { paddingTop: 14 },
  title: { marginTop: 8, marginBottom: 4 },
  empty: { paddingVertical: 24 },
  events: { gap: 12, marginTop: 14 },
  newsKicker: { marginTop: 14 },
  card: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  image: { width: "100%", aspectRatio: 16 / 9 },
  body: { padding: 16, gap: 8 },
  cardTitle: { fontFamily: fonts.display, fontSize: 25, lineHeight: 29 },
  moreRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  more: { fontFamily: fonts.textBold, fontSize: 13 },
});

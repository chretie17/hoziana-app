import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { Body, Chip, Heading, Kicker, Screen, SearchField, StatusNote } from "@/components/ui";
import { useContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { normalizeSearch } from "@/lib/search";
import { fonts, usePalette } from "@/lib/theme";
import type { Song } from "@/lib/types";

type Filter = "all" | "audio";
type Order = "number" | "letter";

/** The letter a title files under; numbers and signs go under "#". */
function initialOf(title: string): string {
  const letter = normalizeSearch(title).replace(/^[^a-z0-9]+/, "").charAt(0).toUpperCase();
  return /[A-Z]/.test(letter) ? letter : "#";
}

/** The whole songbook, searchable by title, key or verse, with no signal needed. */
export default function Songs() {
  const { content, status, refresh } = useContent();
  const { t } = useLanguage();
  const palette = usePalette();
  const { focus, only } = useLocalSearchParams<{ focus?: string; only?: string }>();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(only === "audio" ? "audio" : "all");
  // Home's "With audio" can arrive while this tab is already open, so the
  // filter follows the link each time it changes rather than only at first.
  const [linked, setLinked] = useState(only);
  if (only !== linked) {
    setLinked(only);
    setFilter(only === "audio" ? "audio" : "all");
  }
  const deferred = useDeferredValue(query);
  const [order, setOrder] = useState<Order>("number");
  const scrollRef = useRef<ScrollView>(null);

  const ordered = useMemo(
    () => [...content.songs].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || a.title.localeCompare(b.title)),
    [content.songs],
  );
  const withAudio = ordered.some((song) => song.audioUrl);

  const songs = useMemo(() => {
    const needle = normalizeSearch(deferred);
    return ordered.filter((song) => {
      if (filter === "audio" && !song.audioUrl) return false;
      if (!needle) return true;
      return [song.title, song.key ?? "", song.bibleReference ?? "", String(song.order ?? "")].some((field) => normalizeSearch(field).includes(needle));
    });
  }, [ordered, deferred, filter]);

  // By number: one run, 1 to the last. A–Z: a group under each letter.
  const sections = useMemo(() => {
    if (order === "number") return [];
    const groups = new Map<string, Song[]>();
    [...songs]
      .sort((a, b) => normalizeSearch(a.title).localeCompare(normalizeSearch(b.title)))
      .forEach((song) => {
        const letter = initialOf(song.title);
        groups.set(letter, [...(groups.get(letter) ?? []), song]);
      });
    return [...groups.entries()]
      .sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))
      .map(([title, data]) => ({ title, data }));
  }, [songs, order]);

  // Where each letter's heading sits in the scroll, measured as it lays out,
  // so the side index jumps straight there — on a phone and on the web alike.
  const offsets = useRef<Record<string, number>>({});
  const headings = useRef<Record<string, number>>({});
  const jumpTo = (letter: string) => {
    const y = offsets.current[letter];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - (headings.current[letter] ?? 0)), animated: true });
  };

  // Children of the scroll: the header, then each heading and its songs; the
  // headings stay pinned at the top while their songs pass beneath.
  const sticky = order === "letter" ? sections.map((_, index) => 1 + index * 2) : [];
  const separator = <View style={[styles.separator, { backgroundColor: palette.line }]} />;
  const rows = (list: Song[]) => list.map((song, index) => (
    <View key={song.slug}>
      {index > 0 && separator}
      <SongRow song={song} />
    </View>
  ));

  return (
    <Screen>
      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={sticky}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={status === "checking"} onRefresh={() => void refresh()} tintColor={palette.accent} />}
        contentContainerStyle={[styles.list, order === "letter" && styles.listWithIndex]}
      >
        <View style={styles.header}>
          <Kicker>{t.songbookCount(content.songs.length)}</Kicker>
          <Heading size={36} style={styles.title}>{t.songbook}</Heading>
          <SearchField value={query} onChange={setQuery} placeholder={t.searchSongs} autoFocus={focus === "1"} />
          <View style={styles.chips}>
            <Chip label={t.byNumber} active={order === "number"} onPress={() => setOrder("number")} />
            <Chip label={t.byLetter} active={order === "letter"} onPress={() => setOrder("letter")} />
            {withAudio && (
              <>
                <View style={[styles.chipDivider, { backgroundColor: palette.line }]} />
                <Chip label={t.withRecording} active={filter === "audio"} onPress={() => setFilter(filter === "audio" ? "all" : "audio")} />
              </>
            )}
          </View>
          <StatusNote />
        </View>
        {songs.length === 0 ? (
          <View style={styles.empty}>
            <Heading size={24}>{t.noSong}</Heading>
            <Body muted>{t.noSongHelp}</Body>
          </View>
        ) : order === "number" ? (
          <View>{rows(songs)}</View>
        ) : (
          sections.flatMap((section) => [
            <View
              key={`h-${section.title}`}
              onLayout={(event) => { headings.current[section.title] = event.nativeEvent.layout.height; }}
              style={[styles.letterHeader, { backgroundColor: palette.page, borderBottomColor: palette.line }]}
            >
              <Text style={[styles.letter, { color: palette.accentDeep }]}>{section.title}</Text>
              <Text style={[styles.letterCount, { color: palette.muted }]}>{section.data.length}</Text>
            </View>,
            // A pinned heading is measured inside its own wrapper, so the
            // place to jump to is taken from the songs beneath it instead.
            <View key={`g-${section.title}`} onLayout={(event) => { offsets.current[section.title] = event.nativeEvent.layout.y; }}>{rows(section.data)}</View>,
          ])
        )}
      </ScrollView>
      {order === "letter" && sections.length > 1 && (
        <View style={styles.index} pointerEvents="box-none">
          {sections.map((section) => (
            <Pressable key={section.title} onPress={() => jumpTo(section.title)} hitSlop={{ left: 12, right: 8 }} accessibilityRole="button" accessibilityLabel={section.title}>
              <Text style={[styles.indexLetter, { color: palette.accentDeep }]}>{section.title}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function SongRow({ song }: { song: Song }) {
  const palette = usePalette();
  const { t } = useLanguage();
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/song/[slug]", params: { slug: song.slug } })}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.sand }]}
      accessibilityRole="button"
      accessibilityLabel={song.title}
    >
      <View style={[styles.badge, { backgroundColor: palette.sand, borderColor: palette.line }]}>
        <Text style={[styles.number, { color: palette.accentDeep }]}>{song.order ? String(song.order).padStart(2, "0") : "—"}</Text>
      </View>
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={[styles.songTitle, { color: palette.ink }]}>{song.title}</Text>
        <Text numberOfLines={1} style={[styles.meta, { color: palette.muted }]}>
          {[song.key ? `${t.key} ${song.key}` : null, song.bibleReference, song.status === "awaiting-review" ? t.awaitingReview : null].filter(Boolean).join(" · ") || " "}
        </Text>
      </View>
      {song.audioUrl ? <Ionicons name="musical-notes" size={16} color={palette.accentDeep} /> : null}
      {song.videoId ? <Ionicons name="logo-youtube" size={16} color={palette.muted} /> : null}
      <Ionicons name="chevron-forward" size={16} color={palette.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  title: { marginTop: 8, marginBottom: 16 },
  chips: { flexDirection: "row", gap: 8, marginTop: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingHorizontal: 16, paddingVertical: 10 },
  listWithIndex: { paddingRight: 22 },
  chipDivider: { width: 1, alignSelf: "stretch", marginHorizontal: 2 },
  badge: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  number: { fontFamily: fonts.display, fontSize: 18, fontVariant: ["tabular-nums"] },
  letterHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  letter: { fontFamily: fonts.display, fontSize: 26 },
  letterCount: { fontFamily: fonts.text, fontSize: 12 },
  index: { position: "absolute", right: 2, top: 0, bottom: 0, justifyContent: "center", alignItems: "center", gap: 1, paddingVertical: 80 },
  indexLetter: { fontFamily: fonts.textBold, fontSize: 11, lineHeight: 15, paddingHorizontal: 4 },
  rowText: { flex: 1 },
  songTitle: { fontFamily: fonts.textBold, fontSize: 15 },
  meta: { fontFamily: fonts.text, fontSize: 12.5, marginTop: 3 },
  separator: { height: 1, marginLeft: 72 },
  empty: { padding: 24, gap: 8 },
});

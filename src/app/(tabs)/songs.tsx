import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { Body, Chip, Heading, Kicker, Screen, SearchField, StatusNote } from "@/components/ui";
import { useContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { normalizeSearch } from "@/lib/search";
import { fonts, usePalette } from "@/lib/theme";
import type { Song } from "@/lib/types";

type Filter = "all" | "audio";

/** The whole songbook, searchable by title, key or verse, with no signal needed. */
export default function Songs() {
  const { content, status, refresh } = useContent();
  const { t } = useLanguage();
  const palette = usePalette();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const deferred = useDeferredValue(query);

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

  return (
    <Screen>
      <FlatList
        data={songs}
        keyExtractor={(song) => song.slug}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={status === "checking"} onRefresh={() => void refresh()} tintColor={palette.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Kicker>{t.songbookCount(content.songs.length)}</Kicker>
            <Heading size={36} style={styles.title}>{t.songbook}</Heading>
            <SearchField value={query} onChange={setQuery} placeholder={t.searchSongs} />
            {withAudio && (
              <View style={styles.chips}>
                <Chip label={t.all} active={filter === "all"} onPress={() => setFilter("all")} />
                <Chip label={t.withRecording} active={filter === "audio"} onPress={() => setFilter("audio")} />
              </View>
            )}
            <StatusNote />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Heading size={24}>{t.noSong}</Heading>
            <Body muted>{t.noSongHelp}</Body>
          </View>
        }
        renderItem={({ item }) => <SongRow song={item} />}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: palette.line }]} />}
        contentContainerStyle={styles.list}
        initialNumToRender={20}
      />
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
      <Text style={[styles.number, { color: palette.accentDeep }]}>{song.order ?? "—"}</Text>
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
  number: { width: 32, fontFamily: fonts.display, fontSize: 20, textAlign: "center" },
  rowText: { flex: 1 },
  songTitle: { fontFamily: fonts.textBold, fontSize: 15 },
  meta: { fontFamily: fonts.text, fontSize: 12.5, marginTop: 3 },
  separator: { height: 1, marginLeft: 60 },
  empty: { padding: 24, gap: 8 },
});

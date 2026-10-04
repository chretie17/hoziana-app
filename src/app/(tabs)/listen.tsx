import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { Body, Chip, Heading, Kicker, Screen, SearchField, StatusNote } from "@/components/ui";
import { useContent } from "@/lib/content";
import { formatDate, useLanguage } from "@/lib/i18n";
import { normalizeSearch, youtubeThumbnail } from "@/lib/search";
import { fonts, usePalette } from "@/lib/theme";
import type { Video } from "@/lib/types";

const songFormats = new Set(["Official video", "Official lyric video", "Full album"]);
type Shelf = "songs" | "sessions";

/** The choir's recordings, songs and past live sessions apart, as on the website. */
export default function Listen() {
  const { content, status, refresh } = useContent();
  const { t, language } = useLanguage();
  const palette = usePalette();
  const [shelf, setShelf] = useState<Shelf>("songs");
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const live = content.liveBroadcast.announced ? content.liveBroadcast.videoId : null;

  const videos = useMemo(() => {
    const needle = normalizeSearch(deferred);
    return content.videos
      .filter((video) => (shelf === "songs" ? songFormats.has(video.format) : video.format === "Live performance"))
      .filter((video) => !needle || normalizeSearch(video.title).includes(needle))
      .sort((a, b) => b.publishedOn.localeCompare(a.publishedOn));
  }, [content.videos, shelf, deferred]);

  return (
    <Screen>
      <FlatList
        data={videos}
        keyExtractor={(video) => video.videoId}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={status === "checking"} onRefresh={() => void refresh()} tintColor={palette.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Kicker>{t.officialVideos}</Kicker>
            <Heading size={36} style={styles.title}>{t.tabs.listen}</Heading>
            {live ? (
              <Pressable onPress={() => router.push({ pathname: "/video/[id]", params: { id: live } })} style={[styles.live, { backgroundColor: palette.accentDeep }]} accessibilityRole="button">
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{t.liveNow}</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </Pressable>
            ) : null}
            <View style={styles.chips}>
              <Chip label={t.songsHeading} active={shelf === "songs"} onPress={() => setShelf("songs")} />
              <Chip label={t.sessions} active={shelf === "sessions"} onPress={() => setShelf("sessions")} />
            </View>
            <SearchField value={query} onChange={setQuery} placeholder={t.searchVideos} />
            <StatusNote />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Heading size={24}>{t.noSong}</Heading>
            <Body muted>{t.noSongHelp}</Body>
          </View>
        }
        renderItem={({ item }) => <VideoRow video={item} meta={`${t.formats[item.format]} · ${formatDate(item.publishedOn, language)}`} />}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

function VideoRow({ video, meta }: { video: Video; meta: string }) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/video/[id]", params: { id: video.videoId } })}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.sand }]}
      accessibilityRole="button"
      accessibilityLabel={video.title}
    >
      <View>
        <Image source={youtubeThumbnail(video.videoId)} style={styles.thumb} contentFit="cover" transition={200} />
        <View style={styles.play}><Ionicons name="play" size={12} color="#fff" /></View>
      </View>
      <View style={styles.rowText}>
        <Text numberOfLines={2} style={[styles.videoTitle, { color: palette.ink }]}>{video.title}</Text>
        <Text numberOfLines={1} style={[styles.meta, { color: palette.muted }]}>{meta}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  title: { marginTop: 8, marginBottom: 14 },
  live: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, marginBottom: 14 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ff4b4b" },
  liveText: { flex: 1, color: "#fff", fontFamily: fonts.textBold, fontSize: 14 },
  chips: { flexDirection: "row", gap: 8, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 9 },
  thumb: { width: 128, height: 72, borderRadius: 10, backgroundColor: "#0002" },
  play: { position: "absolute", left: 6, bottom: 6, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#000a" },
  rowText: { flex: 1 },
  videoTitle: { fontFamily: fonts.textBold, fontSize: 14.5, lineHeight: 19 },
  meta: { fontFamily: fonts.text, fontSize: 12, marginTop: 4 },
  empty: { padding: 24, gap: 8 },
});

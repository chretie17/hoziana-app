import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AlbumCover } from "@/components/AlbumCover";
import { Heading, Kicker, Screen } from "@/components/ui";
import { useContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { fonts, usePalette } from "@/lib/theme";

/** One album: its cover, then its songs in order, each opening its words when the songbook has them. */
export default function AlbumPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { content } = useContent();
  const { t } = useLanguage();
  const palette = usePalette();
  const albums = content.albums ?? [];
  const index = albums.findIndex((album) => album.id === id);
  const album = albums[index];
  const bySlug = useMemo(() => new Map(content.songs.map((song) => [song.slug, song])), [content.songs]);

  if (!album) {
    return (
      <Screen edges={[]}>
        <View style={styles.missing}><Heading size={24}>{t.noSong}</Heading></View>
      </Screen>
    );
  }

  const withWords = album.tracks.filter((track) => track.slug && bySlug.has(track.slug)).length;
  const volume = /^Vol (\d+)$/.exec(album.title)?.[1];

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: t.albums }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: palette.dark }]}>
          <AlbumCover album={album} index={index} size={112} />
          <View style={styles.heroText}>
            <Kicker light>{volume ? `${t.volume} ${volume}` : t.albums}</Kicker>
            <Heading light size={30} style={styles.title}>{album.title}</Heading>
            <Text style={[styles.count, { color: palette.onDarkMuted }]}>{t.albumSongs(album.tracks.length)} · {t.withWords(withWords)}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.line }]}>
          {album.tracks.map((track, position) => {
            const song = track.slug ? bySlug.get(track.slug) : undefined;
            return (
              <Pressable
                key={`${track.title}-${position}`}
                disabled={!song}
                onPress={() => song && router.push({ pathname: "/song/[slug]", params: { slug: song.slug } })}
                style={({ pressed }) => [styles.row, position > 0 && { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth }, pressed && { backgroundColor: palette.sand }]}
                accessibilityRole={song ? "button" : "text"}
                accessibilityLabel={track.title}
              >
                <Text style={[styles.track, { color: song ? palette.accentDeep : palette.muted }]}>{String(position + 1).padStart(2, "0")}</Text>
                <View style={styles.rowText}>
                  <Text numberOfLines={1} style={[styles.songTitle, { color: song ? palette.ink : palette.muted }]}>{track.title}</Text>
                  <Text numberOfLines={1} style={[styles.meta, { color: palette.muted }]}>
                    {song ? [song.order ? `Nº ${song.order}` : null, song.key ? `${t.key} ${song.key}` : null].filter(Boolean).join(" · ") || t.lyrics : t.notInSongbook}
                  </Text>
                </View>
                {song?.audioUrl ? <View style={[styles.dot, { backgroundColor: palette.accentSoft }]}><Ionicons name="headset" size={12} color={palette.accentDeep} /></View> : null}
                {song ? <Ionicons name="chevron-forward" size={16} color={palette.muted} /> : <Ionicons name="musical-note-outline" size={16} color={palette.line} />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  missing: { padding: 24 },
  hero: { flexDirection: "row", alignItems: "center", gap: 16, margin: 12, padding: 16, borderRadius: 26 },
  heroText: { flex: 1 },
  title: { marginTop: 6 },
  count: { fontFamily: fonts.text, fontSize: 13, marginTop: 6 },
  card: { marginHorizontal: 12, marginTop: 6, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 66, paddingHorizontal: 16, paddingVertical: 10 },
  track: { width: 30, fontFamily: fonts.display, fontSize: 22, fontVariant: ["tabular-nums"] },
  rowText: { flex: 1, gap: 4 },
  songTitle: { fontFamily: fonts.textBold, fontSize: 15 },
  meta: { fontFamily: fonts.text, fontSize: 12 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});

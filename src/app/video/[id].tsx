import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { YouTubePlayer } from "@/components/YouTubePlayer";
import { Button, Heading, Kicker, Screen } from "@/components/ui";
import { useContent } from "@/lib/content";
import { formatDate, useLanguage } from "@/lib/i18n";
import { usePlayer } from "@/lib/player";
import { youtubeThumbnail } from "@/lib/search";
import { fonts, usePalette } from "@/lib/theme";

export default function VideoPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { content } = useContent();
  const { t, language } = useLanguage();
  const palette = usePalette();
  const { status, track, toggle } = usePlayer();
  const songPlaying = Boolean(track && status.playing);

  const video = content.videos.find((entry) => entry.videoId === id);
  const title = video?.title ?? content.homepage.title;
  const song = content.songs.find((entry) => entry.videoId === id);
  const more = useMemo(
    () => content.videos.filter((entry) => entry.videoId !== id && (video ? entry.format === video.format : true)).sort((a, b) => b.publishedOn.localeCompare(a.publishedOn)).slice(0, 6),
    [content.videos, id, video],
  );

  // A song and a video at once would talk over each other, so a recording
  // that is playing pauses when a video opens.
  useEffect(() => {
    if (songPlaying && track) toggle(track);
    // Only on opening: pressing play again afterwards is the listener's choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <Screen edges={[]} dark>
      <YouTubePlayer videoId={id} title={title} />
      <ScrollView contentContainerStyle={styles.content}>
        {video ? <Kicker light>{t.formats[video.format]} · {formatDate(video.publishedOn, language)}</Kicker> : null}
        <Heading light size={28} style={styles.title}>{title}</Heading>

        <View style={styles.actions}>
          {song ? (
            <Button label={t.lyrics} icon="book-outline" onPress={() => router.push({ pathname: "/song/[slug]", params: { slug: song.slug } })} />
          ) : null}
          <Button label="YouTube" icon="logo-youtube" tone="outline" onPress={() => void Linking.openURL(video?.youtubeUrl ?? `https://www.youtube.com/watch?v=${id}`)} style={{ borderColor: "#ffffff40" }} />
        </View>

        {more.length > 0 && <Text style={[styles.moreHeading, { color: palette.accentSoft }]}>{t.moreVideos}</Text>}
        {more.map((entry) => (
          <Pressable key={entry.videoId} style={styles.row} onPress={() => router.replace({ pathname: "/video/[id]", params: { id: entry.videoId } })} accessibilityRole="button" accessibilityLabel={entry.title}>
            <Image source={youtubeThumbnail(entry.videoId)} style={styles.thumb} contentFit="cover" transition={200} />
            <View style={styles.rowText}>
              <Text numberOfLines={2} style={styles.rowTitle}>{entry.title}</Text>
              <Text style={[styles.rowMeta, { color: palette.onDarkMuted }]}>{formatDate(entry.publishedOn, language)}</Text>
            </View>
            <Ionicons name="play-circle-outline" size={22} color={palette.accent} />
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  title: { marginTop: 10 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 },
  moreHeading: { fontFamily: fonts.textBold, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 32, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9 },
  thumb: { width: 112, height: 63, borderRadius: 8, backgroundColor: "#ffffff14" },
  rowText: { flex: 1 },
  rowTitle: { color: "#fff", fontFamily: fonts.textBold, fontSize: 14, lineHeight: 19 },
  rowMeta: { fontFamily: fonts.text, fontSize: 12, marginTop: 3 },
});

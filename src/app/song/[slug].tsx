import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { Button, Heading, Kicker, Screen } from "@/components/ui";
import { useContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { clock, usePlayer } from "@/lib/player";
import { readText, writeText } from "@/lib/storage";
import { fonts, usePalette } from "@/lib/theme";
import type { Song } from "@/lib/types";

const sizes = [16, 18, 20, 23, 26, 30];
const sizeFile = "reading-size.txt";

export default function SongPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { content } = useContent();
  const { t } = useLanguage();
  const palette = usePalette();
  const [sizeIndex, setSizeIndex] = useState(2);

  useEffect(() => {
    void readText(sizeFile).then((saved) => {
      if (!saved) return;
      const index = Number(saved);
      if (Number.isInteger(index) && index >= 0 && index < sizes.length) setSizeIndex(index);
    });
  }, []);

  const changeSize = (step: number) => {
    const next = Math.max(0, Math.min(sizes.length - 1, sizeIndex + step));
    setSizeIndex(next);
    void writeText(sizeFile, String(next));
  };

  const ordered = useMemo(
    () => [...content.songs].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || a.title.localeCompare(b.title)),
    [content.songs],
  );
  const index = ordered.findIndex((song) => song.slug === slug);
  const song = ordered[index];

  if (!song) {
    return (
      <Screen edges={[]}>
        <View style={styles.missing}>
          <Heading size={26}>{t.noSong}</Heading>
          <Button label={t.songbook} onPress={() => router.back()} tone="outline" />
        </View>
      </Screen>
    );
  }

  const fontSize = sizes[sizeIndex];
  const previous = ordered[index - 1];
  const next = ordered[index + 1];

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: song.order ? `${t.songbook} · ${song.order}` : t.songbook }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Kicker>{song.status === "awaiting-review" ? t.awaitingReview : t.songbook}</Kicker>
        <Heading size={34} style={styles.title}>{song.title}</Heading>

        <View style={styles.facts}>
          {song.key ? <Fact label={t.key} value={song.key} /> : null}
          {song.bibleReference ? <Fact label={t.scripture} value={song.bibleReference} /> : null}
        </View>

        {song.audioUrl ? <SongAudio song={song} /> : null}
        {song.videoId ? (
          <Button label={t.watchRecording} icon="logo-youtube" tone="dark" onPress={() => router.push({ pathname: "/video/[id]", params: { id: song.videoId as string } })} style={styles.watch} />
        ) : null}

        <View style={[styles.sizer, { borderColor: palette.line }]}>
          <Text style={[styles.sizerLabel, { color: palette.muted }]}>{t.textSize}</Text>
          <Pressable onPress={() => changeSize(-1)} disabled={sizeIndex === 0} hitSlop={8} style={[styles.sizeButton, { borderColor: palette.line, opacity: sizeIndex === 0 ? 0.35 : 1 }]} accessibilityRole="button" accessibilityLabel={`${t.textSize} −`}>
            <Text style={[styles.sizeSmall, { color: palette.ink }]}>A</Text>
          </Pressable>
          <Pressable onPress={() => changeSize(1)} disabled={sizeIndex === sizes.length - 1} hitSlop={8} style={[styles.sizeButton, { borderColor: palette.line, opacity: sizeIndex === sizes.length - 1 ? 0.35 : 1 }]} accessibilityRole="button" accessibilityLabel={`${t.textSize} +`}>
            <Text style={[styles.sizeLarge, { color: palette.ink }]}>A</Text>
          </Pressable>
        </View>

        {song.paragraphs.map((paragraph, stanza) => (
          <Text key={stanza} selectable style={[styles.stanza, { fontSize, lineHeight: Math.round(fontSize * 1.55), color: palette.ink }]}>
            {paragraph}
          </Text>
        ))}

        <View style={styles.pager}>
          {previous ? (
            <Pressable style={[styles.pageLink, { borderColor: palette.line }]} onPress={() => router.replace({ pathname: "/song/[slug]", params: { slug: previous.slug } })} accessibilityRole="button">
              <Text style={[styles.pageHint, { color: palette.muted }]}>← {t.previousSong}</Text>
              <Text numberOfLines={2} style={[styles.pageTitle, { color: palette.ink }]}>{previous.title}</Text>
            </Pressable>
          ) : <View style={styles.pageSpacer} />}
          {next ? (
            <Pressable style={[styles.pageLink, styles.pageNext, { borderColor: palette.line }]} onPress={() => router.replace({ pathname: "/song/[slug]", params: { slug: next.slug } })} accessibilityRole="button">
              <Text style={[styles.pageHint, { color: palette.muted }]}>{t.nextSong} →</Text>
              <Text numberOfLines={2} style={[styles.pageTitle, styles.right, { color: palette.ink }]}>{next.title}</Text>
            </Pressable>
          ) : <View style={styles.pageSpacer} />}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const palette = usePalette();
  return (
    <View style={[styles.fact, { backgroundColor: palette.sand }]}>
      <Text style={[styles.factLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.factValue, { color: palette.ink }]}>{value}</Text>
    </View>
  );
}

/** Play, pause and a bar to tap anywhere along; keeps playing on the lock screen. */
function SongAudio({ song }: { song: Song }) {
  const { track, status, toggle, seek } = usePlayer();
  const { t } = useLanguage();
  const palette = usePalette();
  const [width, setWidth] = useState(0);
  const mine = track?.url === song.audioUrl;
  const playing = mine && status.playing;
  const duration = mine ? status.duration : 0;
  const position = mine ? status.currentTime : 0;
  const known = Number.isFinite(duration) && duration > 0;

  return (
    <View style={[styles.audio, { backgroundColor: palette.dark }]}>
      <Pressable
        onPress={() => toggle({ slug: song.slug, title: song.title, url: song.audioUrl as string })}
        style={[styles.audioButton, { backgroundColor: palette.accent }]}
        accessibilityRole="button"
        accessibilityLabel={playing ? t.paused : t.listenWhileReading}
      >
        <Ionicons name={playing ? "pause" : "play"} size={24} color={palette.dark} style={playing ? undefined : { marginLeft: 3 }} />
      </Pressable>
      <View style={styles.audioBody}>
        <Text style={[styles.audioLabel, { color: palette.accentSoft }]}>{t.listenWhileReading}</Text>
        <Pressable
          onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
          onPress={(event) => {
            if (known && width > 0) seek((event.nativeEvent.locationX / width) * duration);
          }}
          style={styles.track}
          accessibilityRole="adjustable"
          accessibilityValue={{ text: `${clock(position)} / ${clock(duration)}` }}
        >
          <View style={[styles.trackLine, { backgroundColor: "#ffffff33" }]}>
            <View style={[styles.trackFill, { width: `${known ? (position / duration) * 100 : 0}%`, backgroundColor: palette.accent }]} />
          </View>
        </Pressable>
        <Text style={styles.audioTime}>{known ? `${clock(position)} / ${clock(duration)}` : mine ? clock(position) : "—"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  missing: { padding: 24, gap: 16 },
  title: { marginTop: 10 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  fact: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  factLabel: { fontFamily: fonts.textBold, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  factValue: { fontFamily: fonts.textMedium, fontSize: 14, marginTop: 2 },
  audio: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 20, padding: 14, borderRadius: 16 },
  audioButton: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  audioBody: { flex: 1 },
  audioLabel: { fontFamily: fonts.textBold, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  track: { height: 28, justifyContent: "center" },
  trackLine: { height: 4, borderRadius: 2, overflow: "hidden" },
  trackFill: { height: 4 },
  audioTime: { color: "#ffffffb0", fontFamily: fonts.text, fontSize: 12 },
  watch: { marginTop: 12 },
  sizer: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 22, marginBottom: 6, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1 },
  sizerLabel: { flex: 1, fontFamily: fonts.textMedium, fontSize: 13 },
  sizeButton: { width: 44, height: 40, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sizeSmall: { fontFamily: fonts.textBold, fontSize: 13 },
  sizeLarge: { fontFamily: fonts.textBold, fontSize: 19 },
  stanza: { fontFamily: fonts.text, marginTop: 20 },
  pager: { flexDirection: "row", gap: 10, marginTop: 36 },
  pageLink: { flex: 1, padding: 14, borderWidth: 1, borderRadius: 14 },
  pageNext: { alignItems: "flex-end" },
  pageSpacer: { flex: 1 },
  pageHint: { fontFamily: fonts.textMedium, fontSize: 12 },
  pageTitle: { fontFamily: fonts.textBold, fontSize: 13.5, marginTop: 4 },
  right: { textAlign: "right" },
});

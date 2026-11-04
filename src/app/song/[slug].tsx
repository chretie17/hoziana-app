import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { Button, Heading, Kicker, Screen } from "@/components/ui";
import { useContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { clock, usePlayer } from "@/lib/player";
import { useRecents } from "@/lib/recents";
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

  const { remember } = useRecents();
  useEffect(() => {
    if (song) remember(song.slug);
  }, [song, remember]);

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
  // Every album the song is on, and where on it.
  const onAlbums = (content.albums ?? []).flatMap((album) =>
    album.tracks.flatMap((entry, position) => (entry.slug === song.slug ? [{ album, track: position + 1 }] : [])),
  );
  const previous = ordered[index - 1];
  const next = ordered[index + 1];

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: song.order ? `${t.songbook} · ${song.order}` : t.songbook }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: palette.dark }]}>
          {song.order ? <Text style={[styles.heroNumber, { color: palette.darkSoft }]} accessible={false}>{song.order}</Text> : null}
          <Kicker light>{song.status === "awaiting-review" ? t.awaitingReview : song.order ? `${t.songbook} · ${String(song.order).padStart(2, "0")}` : t.songbook}</Kicker>
          <Heading light size={34} style={styles.title}>{song.title}</Heading>
          <View style={styles.facts}>
            {song.key ? <Fact icon="musical-note" label={t.key} value={song.key} /> : null}
            {song.bibleReference ? <Fact icon="book-outline" label={t.scripture} value={song.bibleReference} /> : null}
          </View>
          {onAlbums.length > 0 ? (
            <View style={styles.albums}>
              <Text style={[styles.albumsLabel, { color: palette.onDarkMuted }]}>{t.albums}</Text>
              <View style={styles.facts}>
                {onAlbums.map(({ album, track }) => (
                  <Pressable
                    key={album.id}
                    onPress={() => router.push({ pathname: "/album/[id]", params: { id: album.id } })}
                    style={({ pressed }) => [styles.fact, { borderColor: palette.darkSoft }, pressed && { backgroundColor: "rgba(255,255,255,0.1)" }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${album.title}, ${track}`}
                  >
                    <Ionicons name="disc" size={14} color={palette.accent} />
                    <Text style={[styles.factValue, { color: palette.onDark }]}>{album.title}</Text>
                    <Text style={[styles.albumTrack, { color: palette.onDarkMuted }]}>#{track}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          {song.audioUrl ? <SongAudio song={song} /> : null}
          {song.videoId ? (
            <Pressable
              onPress={() => router.push({ pathname: "/video/[id]", params: { id: song.videoId as string } })}
              style={({ pressed }) => [styles.watch, { borderColor: palette.darkSoft }, pressed && { backgroundColor: "rgba(255,255,255,0.08)" }]}
              accessibilityRole="button"
            >
              <View style={[styles.watchIcon, { backgroundColor: palette.accent }]}><Ionicons name="play" size={14} color={palette.dark} style={{ marginLeft: 2 }} /></View>
              <Text style={[styles.watchText, { color: palette.onDark }]}>{t.watchRecording}</Text>
              <Ionicons name="chevron-forward" size={16} color={palette.onDarkMuted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.toolbar}>
          <View style={[styles.rule, { backgroundColor: palette.line }]} />
          <View style={[styles.sizer, { backgroundColor: palette.card, borderColor: palette.line }]} accessibilityLabel={t.textSize}>
            <Pressable onPress={() => changeSize(-1)} disabled={sizeIndex === 0} hitSlop={6} style={[styles.sizeButton, { opacity: sizeIndex === 0 ? 0.3 : 1 }]} accessibilityRole="button" accessibilityLabel={`${t.textSize} −`}>
              <Text style={[styles.sizeSmall, { color: palette.ink }]}>A</Text>
            </Pressable>
            <View style={[styles.sizerDivider, { backgroundColor: palette.line }]} />
            <Pressable onPress={() => changeSize(1)} disabled={sizeIndex === sizes.length - 1} hitSlop={6} style={[styles.sizeButton, { opacity: sizeIndex === sizes.length - 1 ? 0.3 : 1 }]} accessibilityRole="button" accessibilityLabel={`${t.textSize} +`}>
              <Text style={[styles.sizeLarge, { color: palette.ink }]}>A</Text>
            </Pressable>
          </View>
        </View>

        {song.paragraphs.map((paragraph, stanza) => <Stanza key={stanza} text={paragraph} fontSize={fontSize} />)}

        <View style={styles.pager}>
          {previous ? <PageLink song={previous} hint={t.previousSong} direction="previous" /> : <View style={styles.pageSpacer} />}
          {next ? <PageLink song={next} hint={t.nextSong} direction="next" /> : <View style={styles.pageSpacer} />}
        </View>
      </ScrollView>
    </Screen>
  );
}

// The songbook marks who sings a line ("Gore:", "Gabo:", "Bose:"…), numbers
// its verses with Roman numerals ("II.") and marks repeats with "/2".
const VERSE = /^(I{1,3}|IV|V|VI{1,3}|IX|X)\.\s*/;
const PART = /^((?:(?:I{1,3}|IV|V)\.\s*)?(?:Bose|Gabo|Gore|Basse|Mume|Mke|Solo|Alto|Soprano|Tenor))\s*:\s*/i;
const REPEAT = /\s*\/\s*(\d+)/g;

/** One verse: its numeral in the margin, each line with who sings it, repeats as ×2. */
function Stanza({ text, fontSize }: { text: string; fontSize: number }) {
  const palette = usePalette();
  const verse = VERSE.exec(text.trim());
  const body = verse && !PART.test(text.trim()) ? text.trim().slice(verse[0].length) : text.trim();
  const lineHeight = Math.round(fontSize * 1.55);
  return (
    <View style={styles.stanza}>
      <View style={styles.gutter}>
        {verse ? (
          <Text style={[styles.verseNumber, { color: palette.accentDeep }]}>{verse[1]}</Text>
        ) : (
          <View style={[styles.gutterBar, { backgroundColor: palette.accentSoft }]} />
        )}
      </View>
      <View style={styles.lines}>
        {body.split("\n").map((raw, index) => {
          const line = raw.trim();
          if (!line) return null;
          const part = PART.exec(line);
          const words = part ? line.slice(part[0].length) : line;
          return (
            <View key={index} style={styles.line}>
              {part ? <PartTag name={part[1]} fontSize={fontSize} /> : null}
              <Text selectable style={[styles.lyric, { fontSize, lineHeight, color: palette.ink }]}>
                {withRepeats(words, palette.accentDeep, fontSize)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function withRepeats(text: string, color: string, fontSize: number) {
  const pieces: (string | React.ReactElement)[] = [];
  let last = 0;
  for (const match of text.matchAll(REPEAT)) {
    pieces.push(text.slice(last, match.index));
    pieces.push(<Text key={match.index} style={[styles.repeat, { color, fontSize: Math.max(12, fontSize * 0.72) }]}>{`  ×${match[1]}`}</Text>);
    last = (match.index ?? 0) + match[0].length;
  }
  pieces.push(text.slice(last));
  return pieces;
}

/** Who sings the line, as a small tag: all together filled, women and men in two tones. */
function PartTag({ name, fontSize }: { name: string; fontSize: number }) {
  const palette = usePalette();
  const key = name.replace(/^[IVX]+\.\s*/, "").toLowerCase();
  const look =
    key === "bose" ? { backgroundColor: palette.accentDeep, color: "#fff", borderColor: palette.accentDeep }
    : key === "gore" || key === "mke" ? { backgroundColor: palette.accentSoft, color: palette.accentDeep, borderColor: palette.accentSoft }
    : key === "gabo" || key === "mume" ? { backgroundColor: palette.sand, color: palette.ink, borderColor: palette.line }
    : { backgroundColor: "transparent", color: palette.muted, borderColor: palette.line };
  return (
    <View style={[styles.part, { backgroundColor: look.backgroundColor, borderColor: look.borderColor, marginTop: Math.max(0, (Math.round(fontSize * 1.55) - 22) / 2) }]}>
      <Text style={[styles.partText, { color: look.color }]}>{name}</Text>
    </View>
  );
}

function PageLink({ song, hint, direction }: { song: Song; hint: string; direction: "previous" | "next" }) {
  const palette = usePalette();
  const next = direction === "next";
  return (
    <Pressable
      style={({ pressed }) => [styles.pageLink, next && styles.pageNext, { backgroundColor: palette.card, borderColor: palette.line }, pressed && { backgroundColor: palette.sand }]}
      onPress={() => router.replace({ pathname: "/song/[slug]", params: { slug: song.slug } })}
      accessibilityRole="button"
    >
      <View style={[styles.pageHintRow, next && styles.reverse]}>
        <Ionicons name={next ? "arrow-forward" : "arrow-back"} size={13} color={palette.accentDeep} />
        <Text style={[styles.pageHint, { color: palette.muted }]}>{hint}{song.order ? ` · ${String(song.order).padStart(2, "0")}` : ""}</Text>
      </View>
      <Text numberOfLines={2} style={[styles.pageTitle, next && styles.right, { color: palette.ink }]}>{song.title}</Text>
    </Pressable>
  );
}

function Fact({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const palette = usePalette();
  return (
    <View style={[styles.fact, { borderColor: palette.darkSoft }]} accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={14} color={palette.accent} />
      <Text style={[styles.factValue, { color: palette.onDark }]}>{value}</Text>
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
    <View style={[styles.audio, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: palette.darkSoft }]}>
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
  content: { paddingBottom: 48 },
  missing: { padding: 24, gap: 16 },
  hero: { margin: 12, marginBottom: 0, padding: 20, paddingTop: 22, borderRadius: 26, overflow: "hidden" },
  heroNumber: { position: "absolute", right: 14, top: -6, fontFamily: fonts.display, fontSize: 120, lineHeight: 130, opacity: 0.55 },
  title: { marginTop: 8, paddingRight: 40 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  fact: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, height: 34, borderRadius: 17, borderWidth: 1 },
  factValue: { fontFamily: fonts.textMedium, fontSize: 13.5 },
  albums: { marginTop: 14, gap: 0 },
  albumsLabel: { fontFamily: fonts.textBold, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: -6 },
  albumTrack: { fontFamily: fonts.textBold, fontSize: 11.5 },
  audio: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 18, padding: 12, borderRadius: 18, borderWidth: 1 },
  audioButton: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  audioBody: { flex: 1 },
  audioLabel: { fontFamily: fonts.textBold, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase" },
  track: { height: 26, justifyContent: "center" },
  trackLine: { height: 4, borderRadius: 2, overflow: "hidden" },
  trackFill: { height: 4 },
  audioTime: { color: "#ffffffb0", fontFamily: fonts.text, fontSize: 12 },
  watch: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, padding: 10, paddingRight: 14, borderRadius: 18, borderWidth: 1 },
  watchIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  watchText: { flex: 1, fontFamily: fonts.textBold, fontSize: 14 },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, marginTop: 22, marginBottom: 4 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  sizer: { flexDirection: "row", alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 4 },
  sizerDivider: { width: StyleSheet.hairlineWidth, height: 18 },
  sizeButton: { width: 42, height: 36, alignItems: "center", justifyContent: "center" },
  sizeSmall: { fontFamily: fonts.display, fontSize: 15 },
  sizeLarge: { fontFamily: fonts.display, fontSize: 22 },
  stanza: { flexDirection: "row", paddingLeft: 8, paddingRight: 20, marginTop: 22 },
  gutter: { width: 40, alignItems: "center", paddingTop: 4 },
  verseNumber: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
  gutterBar: { width: 3, flex: 1, borderRadius: 2, minHeight: 24 },
  lines: { flex: 1, gap: 3 },
  line: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  lyric: { flex: 1, fontFamily: fonts.text },
  repeat: { fontFamily: fonts.textBold },
  part: { height: 22, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, justifyContent: "center", minWidth: 46, alignItems: "center" },
  partText: { fontFamily: fonts.textBold, fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase" },
  pager: { flexDirection: "row", gap: 10, marginTop: 40, paddingHorizontal: 12 },
  pageLink: { flex: 1, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, gap: 6 },
  pageNext: { alignItems: "flex-end" },
  pageSpacer: { flex: 1 },
  pageHintRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reverse: { flexDirection: "row-reverse" },
  pageHint: { fontFamily: fonts.textMedium, fontSize: 12 },
  pageTitle: { fontFamily: fonts.textBold, fontSize: 13.5 },
  right: { textAlign: "right" },
});

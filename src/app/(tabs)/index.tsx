import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Heading, Kicker, Screen, SectionHeader, StatusNote, type IconName } from "@/components/ui";
import { useContent } from "@/lib/content";
import { formatDate, useLanguage } from "@/lib/i18n";
import { usePlayer } from "@/lib/player";
import { useRecents } from "@/lib/recents";
import { youtubeThumbnail } from "@/lib/search";
import { fonts, usePalette } from "@/lib/theme";
import type { Song } from "@/lib/types";
import { openWebsite } from "@/lib/website";

const songFormats = new Set(["Official video", "Official lyric video", "Full album"]);

/** Morning until noon, afternoon until six, evening after. */
function partOfDay(): 0 | 1 | 2 {
  const hour = new Date().getHours();
  return hour < 12 ? 0 : hour < 18 ? 1 : 2;
}

/**
 * The same song for everyone all day, a different one tomorrow — chosen from
 * the songs whose words are complete, so the card is never a half-checked one.
 */
function songOfTheDay(songs: Song[]): Song | undefined {
  const ready = songs.filter((song) => song.status === "published" && song.paragraphs.length > 0);
  if (ready.length === 0) return songs[0];
  const today = new Date();
  const day = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86_400_000);
  return ready[day % ready.length];
}

function openSong(slug: string) {
  router.push({ pathname: "/song/[slug]", params: { slug } });
}

/** Home: the songbook first, as a choir member reaches for it. */
export default function Home() {
  const { content, status, refresh } = useContent();
  const { t, language, pick } = useLanguage();
  const palette = usePalette();
  const { recent } = useRecents();
  const { liveBroadcast, brand } = content;

  const bySlug = useMemo(() => new Map(content.songs.map((song) => [song.slug, song])), [content.songs]);
  const featured = useMemo(() => songOfTheDay(content.songs), [content.songs]);
  const recentSongs = recent.map((slug) => bySlug.get(slug)).filter((song): song is Song => Boolean(song));
  const withAudio = content.songs.filter((song) => song.audioUrl).length;
  const releases = useMemo(
    () => content.videos.filter((video) => songFormats.has(video.format)).sort((a, b) => b.publishedOn.localeCompare(a.publishedOn)).slice(0, 8),
    [content.videos],
  );
  const live = liveBroadcast.announced && liveBroadcast.videoId;

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={status === "checking"} onRefresh={() => void refresh()} tintColor={palette.accent} />}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Image source={brand.logoUrl} style={styles.logo} contentFit="cover" />
          <View style={styles.topText}>
            <Text style={[styles.greeting, { color: palette.muted }]}>{t.greeting[partOfDay()]}</Text>
            <Text style={[styles.brand, { color: palette.ink }]}>{brand.name}</Text>
          </View>
        </View>

        <View style={styles.pad}>
          <Heading size={34} style={styles.heading}>{t.homeHeading}</Heading>

          <Pressable
            onPress={() => router.navigate({ pathname: "/songs", params: { focus: "1" } })}
            style={({ pressed }) => [styles.search, { backgroundColor: palette.card, borderColor: palette.line, opacity: pressed ? 0.85 : 1 }]}
            accessibilityRole="search"
            accessibilityLabel={t.searchShortcut}
          >
            <Ionicons name="search" size={19} color={palette.muted} />
            <Text style={[styles.searchText, { color: palette.muted }]}>{t.searchShortcut}</Text>
          </Pressable>
        </View>

        <StatusNote />

        {live ? (
          <Pressable
            onPress={() => router.push({ pathname: "/video/[id]", params: { id: liveBroadcast.videoId as string } })}
            style={[styles.live, { backgroundColor: palette.accentDeep }]}
            accessibilityRole="button"
          >
            <View style={styles.liveDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.liveTitle}>{t.liveNow}</Text>
              <Text style={styles.liveBody}>{t.liveNowBody}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        ) : null}

        {featured ? <SongOfTheDay song={featured} /> : null}

        <GoToNumber songs={content.songs} />

        {recentSongs.length > 0 && (
          <View style={styles.section}>
            <Kicker style={styles.sectionKicker}>{t.recent}</Kicker>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recents}>
              {recentSongs.map((song) => (
                <Pressable
                  key={song.slug}
                  onPress={() => openSong(song.slug)}
                  style={({ pressed }) => [styles.recent, { backgroundColor: palette.card, borderColor: palette.line, opacity: pressed ? 0.8 : 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel={song.title}
                >
                  <Text style={[styles.recentNumber, { color: palette.accentDeep }]}>{song.order ?? "—"}</Text>
                  <Text numberOfLines={2} style={[styles.recentTitle, { color: palette.ink }]}>{song.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.tiles, styles.pad]}>
          <Tile icon="book" label={t.songbook} detail={t.songbookCount(content.songs.length)} onPress={() => router.navigate("/songs")} strong />
          {withAudio > 0 ? (
            <Tile icon="musical-notes" label={t.withRecording} detail={`${withAudio} · ${t.listenWhileReading}`} onPress={() => router.navigate({ pathname: "/songs", params: { only: "audio" } })} />
          ) : null}
          <Tile icon="play-circle" label={t.watchAndListen} detail={t.officialVideos} onPress={() => router.navigate("/listen")} />
        </View>

        {releases.length > 0 && (
          <View style={styles.section}>
            <View style={styles.pad}>
              <SectionHeader title={t.latestReleases} action={t.seeAll} onAction={() => router.navigate("/listen")} />
            </View>
            <FlatList
              horizontal
              data={releases}
              keyExtractor={(video) => video.videoId}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.releases}
              renderItem={({ item }) => (
                <Pressable style={styles.release} onPress={() => router.push({ pathname: "/video/[id]", params: { id: item.videoId } })} accessibilityRole="button" accessibilityLabel={item.title}>
                  <View>
                    <Image source={youtubeThumbnail(item.videoId)} style={styles.releaseImage} contentFit="cover" transition={200} />
                    <View style={styles.playBadge}><Ionicons name="play" size={13} color="#fff" /></View>
                  </View>
                  <Text numberOfLines={2} style={[styles.releaseTitle, { color: palette.ink }]}>{item.title}</Text>
                  <Text style={[styles.releaseMeta, { color: palette.muted }]}>{item.publishedOn.slice(0, 4)}</Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {content.updates.length > 0 && (
          <View style={[styles.section, styles.pad]}>
            <SectionHeader title={t.latestNews} action={t.seeAll} onAction={() => router.navigate("/updates")} />
            {content.updates.slice(0, 2).map((post) => (
              <Pressable
                key={post.id}
                style={({ pressed }) => [styles.news, { borderColor: palette.line, backgroundColor: palette.card, opacity: pressed ? 0.85 : 1 }]}
                onPress={() => void openWebsite(`/updates/${post.slug}`, palette.accentDeep)}
                accessibilityRole="link"
              >
                {post.imageUrl ? <Image source={post.imageUrl} style={styles.newsImage} contentFit="cover" transition={200} /> : null}
                <View style={styles.newsText}>
                  <Kicker>{t.categories[post.category] ?? post.category} · {formatDate(post.publishedOn, language)}</Kicker>
                  <Text numberOfLines={2} style={[styles.newsTitle, { color: palette.ink }]}>{pick(post.title)}</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={palette.muted} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

/** Today's song, opening on its first lines, with its recording when it has one. */
function SongOfTheDay({ song }: { song: Song }) {
  const { t } = useLanguage();
  const palette = usePalette();
  const { track, status, toggle } = usePlayer();
  // The opening four lines, even when the first verse is a single line.
  const lines = song.paragraphs.flatMap((paragraph) => paragraph.split("\n")).map((line) => line.trim()).filter(Boolean).slice(0, 4);
  const playing = track?.url === song.audioUrl && status.playing;

  return (
    <Pressable onPress={() => openSong(song.slug)} style={[styles.today, { backgroundColor: palette.dark }]} accessibilityRole="button" accessibilityLabel={`${t.songOfTheDay}: ${song.title}`}>
      <View style={styles.todayTop}>
        <Text style={[styles.todayKicker, { color: palette.accent }]}>{t.songOfTheDay}</Text>
        {song.order ? (
          <View style={[styles.badge, { borderColor: "#ffffff30" }]}>
            <Text style={styles.badgeText}>Nº {song.order}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.todayTitle}>{song.title}</Text>
      {song.key || song.bibleReference ? (
        <Text style={[styles.todayMeta, { color: palette.accentSoft }]}>
          {[song.key ? `${t.key} ${song.key}` : null, song.bibleReference].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
      <View style={[styles.verse, { borderLeftColor: palette.accent }]}>
        {lines.map((line, index) => (
          <Text key={index} style={styles.verseLine}>{line}</Text>
        ))}
      </View>
      <View style={styles.todayActions}>
        <View style={[styles.read, { backgroundColor: palette.accent }]}>
          <Ionicons name="book" size={16} color={palette.dark} />
          <Text style={[styles.readText, { color: palette.dark }]}>{t.readWords}</Text>
        </View>
        {song.audioUrl ? (
          <Pressable
            onPress={() => toggle({ slug: song.slug, title: song.title, url: song.audioUrl as string })}
            style={[styles.listen, { borderColor: "#ffffff40" }]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={playing ? t.paused : t.listenWhileReading}
          >
            <Ionicons name={playing ? "pause" : "play"} size={18} color="#fff" />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Choir members know their songs by number; this goes straight to one. */
function GoToNumber({ songs }: { songs: Song[] }) {
  const { t } = useLanguage();
  const palette = usePalette();
  const [value, setValue] = useState("");
  const [missing, setMissing] = useState("");

  const go = () => {
    const number = Number(value);
    if (!value || !Number.isInteger(number)) return;
    const song = songs.find((entry) => entry.order === number);
    if (!song) {
      setMissing(t.noSongNumber(value));
      return;
    }
    setMissing("");
    setValue("");
    openSong(song.slug);
  };

  return (
    <View style={[styles.numberCard, { backgroundColor: palette.sand, borderColor: palette.line }]}>
      <View style={styles.numberRow}>
        <Ionicons name="keypad-outline" size={20} color={palette.accentDeep} />
        <Text style={[styles.numberLabel, { color: palette.ink }]}>{t.goToNumber}</Text>
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text.replace(/\D/g, "").slice(0, 4));
            setMissing("");
          }}
          onSubmitEditing={go}
          placeholder={t.numberPlaceholder}
          placeholderTextColor={palette.muted}
          keyboardType="number-pad"
          returnKeyType="go"
          style={[styles.numberInput, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.card }]}
          accessibilityLabel={t.goToNumber}
        />
        <Pressable onPress={go} style={[styles.numberGo, { backgroundColor: value ? palette.accentDeep : palette.line }]} disabled={!value} accessibilityRole="button" accessibilityLabel={t.go}>
          <Ionicons name="arrow-forward" size={18} color={value ? "#fff" : palette.muted} />
        </Pressable>
      </View>
      {missing ? <Text style={[styles.numberMissing, { color: palette.muted }]}>{missing}</Text> : null}
    </View>
  );
}

function Tile({ icon, label, detail, onPress, strong = false }: { icon: IconName; label: string; detail: string; onPress: () => void; strong?: boolean }) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, strong && styles.tileWide, { backgroundColor: strong ? palette.accentDeep : palette.card, borderColor: strong ? palette.accentDeep : palette.line, opacity: pressed ? 0.85 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={22} color={strong ? "#fff" : palette.accentDeep} />
      <Text style={[styles.tileLabel, { color: strong ? "#fff" : palette.ink }]}>{label}</Text>
      <Text numberOfLines={1} style={[styles.tileDetail, { color: strong ? palette.accentSoft : palette.muted }]}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  pad: { paddingHorizontal: 16 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  logo: { width: 42, height: 42, borderRadius: 21 },
  topText: { flex: 1 },
  greeting: { fontFamily: fonts.textMedium, fontSize: 13 },
  brand: { fontFamily: fonts.textBold, fontSize: 16, marginTop: 1 },
  heading: { marginTop: 14, marginBottom: 16 },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, paddingHorizontal: 16, borderWidth: 1, borderRadius: 26 },
  searchText: { fontFamily: fonts.text, fontSize: 15 },
  live: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16 },
  liveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#ff4b4b" },
  liveTitle: { color: "#fff", fontFamily: fonts.textBold, fontSize: 15 },
  liveBody: { color: "#ffffffcc", fontFamily: fonts.text, fontSize: 13, marginTop: 2 },
  today: { marginHorizontal: 16, marginTop: 18, padding: 20, borderRadius: 22 },
  todayTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  todayKicker: { fontFamily: fonts.textBold, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase" },
  badge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { color: "#fff", fontFamily: fonts.textBold, fontSize: 12 },
  todayTitle: { color: "#fff", fontFamily: fonts.display, fontSize: 30, lineHeight: 34, marginTop: 14 },
  todayMeta: { fontFamily: fonts.textMedium, fontSize: 13, marginTop: 6 },
  verse: { borderLeftWidth: 2, paddingLeft: 14, marginTop: 18, gap: 4 },
  verseLine: { color: "#ffffffde", fontFamily: fonts.displayItalic, fontSize: 19, lineHeight: 26 },
  todayActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 },
  read: { flexDirection: "row", alignItems: "center", gap: 8, height: 44, paddingHorizontal: 18, borderRadius: 22 },
  readText: { fontFamily: fonts.textBold, fontSize: 14 },
  listen: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  numberCard: { marginHorizontal: 16, marginTop: 14, padding: 14, borderWidth: 1, borderRadius: 18 },
  numberRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  numberLabel: { flex: 1, fontFamily: fonts.textBold, fontSize: 14 },
  numberInput: { width: 72, height: 44, borderWidth: 1, borderRadius: 12, textAlign: "center", fontFamily: fonts.textBold, fontSize: 17 },
  numberGo: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  numberMissing: { fontFamily: fonts.text, fontSize: 13, marginTop: 8, marginLeft: 30 },
  section: { marginTop: 24 },
  sectionKicker: { paddingHorizontal: 16, marginBottom: 10 },
  recents: { paddingHorizontal: 16, gap: 10 },
  recent: { width: 150, minHeight: 92, padding: 12, borderWidth: 1, borderRadius: 16, justifyContent: "space-between" },
  recentNumber: { fontFamily: fonts.display, fontSize: 24 },
  recentTitle: { fontFamily: fonts.textBold, fontSize: 13, lineHeight: 17, marginTop: 6 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 24 },
  tile: { flexGrow: 1, flexBasis: "45%", minHeight: 108, padding: 14, borderWidth: 1, borderRadius: 18, gap: 6 },
  tileWide: { flexBasis: "100%" },
  tileLabel: { fontFamily: fonts.textBold, fontSize: 15, marginTop: 4 },
  tileDetail: { fontFamily: fonts.text, fontSize: 12.5 },
  releases: { paddingHorizontal: 16, gap: 12 },
  release: { width: 176 },
  releaseImage: { width: 176, height: 99, borderRadius: 14, backgroundColor: "#0002" },
  playBadge: { position: "absolute", left: 8, bottom: 8, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#000a" },
  releaseTitle: { fontFamily: fonts.textBold, fontSize: 13.5, lineHeight: 18, marginTop: 8 },
  releaseMeta: { fontFamily: fonts.text, fontSize: 12, marginTop: 2 },
  news: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderWidth: 1, borderRadius: 16, marginBottom: 10 },
  newsImage: { width: 72, height: 72, borderRadius: 12 },
  newsText: { flex: 1, gap: 6 },
  newsTitle: { fontFamily: fonts.display, fontSize: 19, lineHeight: 23 },
});

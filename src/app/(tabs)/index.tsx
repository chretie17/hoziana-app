import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Heading, Kicker, Screen, StatusNote, type IconName } from "@/components/ui";
import { languages, useLanguage } from "@/lib/i18n";
import { useContent } from "@/lib/content";
import { usePlayer } from "@/lib/player";
import { useRecents } from "@/lib/recents";
import { normalizeSearch } from "@/lib/search";
import { readText, writeText } from "@/lib/storage";
import { fonts, usePalette } from "@/lib/theme";
import type { Song } from "@/lib/types";

const helpFile = "help-seen.txt";

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

/**
 * Home, kept simple: one box to find any song by its name or number, the few
 * places people go as large buttons, and the songs they opened last.
 */
export default function Home() {
  const { content, status, refresh } = useContent();
  const { t } = useLanguage();
  const palette = usePalette();
  const { recent } = useRecents();
  const { liveBroadcast, brand } = content;

  const bySlug = useMemo(() => new Map(content.songs.map((song) => [song.slug, song])), [content.songs]);
  const featured = useMemo(() => songOfTheDay(content.songs), [content.songs]);
  const recentSongs = recent.map((slug) => bySlug.get(slug)).filter((song): song is Song => Boolean(song)).slice(0, 6);
  const withAudio = content.songs.filter((song) => song.audioUrl).length;
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
            <Text numberOfLines={1} style={[styles.brand, { color: palette.ink }]}>{brand.name}</Text>
          </View>
          <LanguageSwitch />
        </View>

        {live ? (
          <Pressable
            onPress={() => router.push({ pathname: "/video/[id]", params: { id: liveBroadcast.videoId as string } })}
            style={[styles.live, { backgroundColor: palette.accentDeep }]}
            accessibilityRole="button"
          >
            <View style={styles.liveDot} />
            <View style={styles.flex}>
              <Text style={styles.liveTitle}>{t.liveNow}</Text>
              <Text style={styles.liveBody}>{t.liveNowBody}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </Pressable>
        ) : null}

        <FindSong songs={content.songs} />
        <StatusNote />
        <Help />

        <View style={styles.tiles}>
          <Tile icon="book" label={t.songbook} detail={t.songsOfChoir} onPress={() => router.navigate("/songs")} strong />
          {withAudio > 0 ? (
            <Tile icon="headset" label={t.withRecording} detail={`${withAudio}`} onPress={() => router.navigate({ pathname: "/songs", params: { only: "audio" } })} />
          ) : null}
          <Tile icon="play-circle" label={t.watchAndListen} detail={t.videosShort} onPress={() => router.navigate("/listen")} />
          <Tile icon="newspaper" label={t.latestNews} detail={t.newsShort} onPress={() => router.navigate("/updates")} />
        </View>

        {recentSongs.length > 0 && (
          <View style={styles.section}>
            <Kicker style={styles.sectionKicker}>{t.recent}</Kicker>
            <View style={[styles.list, { backgroundColor: palette.card, borderColor: palette.line }]}>
              {recentSongs.map((song, index) => <SongLine key={song.slug} song={song} first={index === 0} />)}
            </View>
          </View>
        )}

        {featured ? <SongOfTheDay song={featured} /> : null}
      </ScrollView>
    </Screen>
  );
}

/** RW · EN · FR, always at hand at the top of Home. */
function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();
  const palette = usePalette();
  return (
    <View style={[styles.languages, { backgroundColor: palette.card, borderColor: palette.line }]} accessibilityLabel={t.language}>
      {languages.map((entry) => {
        const active = entry.code === language;
        return (
          <Pressable
            key={entry.code}
            onPress={() => setLanguage(entry.code)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={entry.label}
            style={[styles.languageButton, active && { backgroundColor: palette.accentDeep }]}
          >
            <Text style={[styles.languageText, { color: active ? "#fff" : palette.ink }]}>{entry.code.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * One box for every way people look for a song: a number opens that song,
 * words show the songs that match as they are typed.
 */
function FindSong({ songs }: { songs: Song[] }) {
  const { t } = useLanguage();
  const palette = usePalette();
  const [value, setValue] = useState("");
  const needle = normalizeSearch(value);
  const number = /^\d+$/.test(needle) ? Number(needle) : null;

  const matches = useMemo(() => {
    if (!needle) return [];
    const found = songs.filter((song) =>
      number !== null
        ? String(song.order ?? "").startsWith(needle)
        : [song.title, song.bibleReference ?? ""].some((field) => normalizeSearch(field).includes(needle)),
    );
    return found.sort((a, b) => (number !== null && a.order === number ? -1 : number !== null && b.order === number ? 1 : (a.order ?? 9999) - (b.order ?? 9999)));
  }, [songs, needle, number]);

  const submit = () => {
    if (matches.length === 1 || (number !== null && matches[0]?.order === number)) {
      setValue("");
      openSong(matches[0].slug);
    } else if (needle) {
      router.navigate({ pathname: "/songs", params: { q: value } });
    }
  };

  return (
    <View style={[styles.find, { backgroundColor: palette.dark }]}>
      <Heading light size={30}>{t.findSong}</Heading>
      <View style={[styles.findField, { backgroundColor: palette.card }]}>
        <Ionicons name="search" size={22} color={palette.accentDeep} />
        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={submit}
          placeholder={t.findPlaceholder}
          placeholderTextColor={palette.muted}
          returnKeyType="search"
          autoCorrect={false}
          style={[styles.findInput, { color: palette.ink }]}
          accessibilityLabel={t.findSong}
        />
        {value ? (
          <Pressable onPress={() => setValue("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="×">
            <Ionicons name="close-circle" size={22} color={palette.muted} />
          </Pressable>
        ) : null}
      </View>

      {needle ? (
        <View style={[styles.results, { backgroundColor: palette.card }]}>
          {matches.length === 0 ? (
            <View style={styles.noResult}>
              <Text style={[styles.noResultTitle, { color: palette.ink }]}>{t.noSong}</Text>
              <Text style={[styles.noResultHelp, { color: palette.muted }]}>{t.noSongHelp}</Text>
            </View>
          ) : (
            matches.slice(0, 5).map((song, index) => <SongLine key={song.slug} song={song} first={index === 0} onOpen={() => setValue("")} />)
          )}
          {matches.length > 5 ? (
            <Pressable onPress={submit} style={[styles.seeAll, { borderTopColor: palette.line }]} accessibilityRole="button">
              <Text style={[styles.seeAllText, { color: palette.accentDeep }]}>{t.seeAllResults(matches.length)}</Text>
              <Ionicons name="arrow-forward" size={16} color={palette.accentDeep} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Three steps, shown until someone says they've got it. */
function Help() {
  const { t } = useLanguage();
  const palette = usePalette();
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    void readText(helpFile).then((saved) => setSeen(saved === "1"));
  }, []);
  if (seen) return null;
  const close = () => {
    setSeen(true);
    void writeText(helpFile, "1");
  };
  return (
    <View style={[styles.help, { backgroundColor: palette.sand, borderColor: palette.line }]}>
      <View style={styles.helpHead}>
        <Ionicons name="information-circle" size={22} color={palette.accentDeep} />
        <Text style={[styles.helpTitle, { color: palette.ink }]}>{t.helpTitle}</Text>
      </View>
      {t.helpSteps.map((step, index) => (
        <View key={index} style={styles.helpStep}>
          <View style={[styles.helpNumber, { backgroundColor: palette.accentDeep }]}><Text style={styles.helpNumberText}>{index + 1}</Text></View>
          <Text style={[styles.helpText, { color: palette.ink }]}>{step}</Text>
        </View>
      ))}
      <Pressable onPress={close} style={[styles.gotIt, { backgroundColor: palette.accentDeep }]} accessibilityRole="button">
        <Text style={styles.gotItText}>{t.gotIt}</Text>
      </Pressable>
    </View>
  );
}

function Tile({ icon, label, detail, onPress, strong = false }: { icon: IconName; label: string; detail: string; onPress: () => void; strong?: boolean }) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: strong ? palette.accentDeep : palette.card, borderColor: strong ? palette.accentDeep : palette.line },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.tileIcon, { backgroundColor: strong ? "rgba(255,255,255,0.16)" : palette.sand }]}>
        <Ionicons name={icon} size={26} color={strong ? "#fff" : palette.accentDeep} />
      </View>
      <Text numberOfLines={2} style={[styles.tileLabel, { color: strong ? "#fff" : palette.ink }]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.tileDetail, { color: strong ? "rgba(255,255,255,0.75)" : palette.muted }]}>{detail}</Text>
    </Pressable>
  );
}

/** A song as one easy line: its number, its name, and an arrow. */
function SongLine({ song, first, onOpen }: { song: Song; first: boolean; onOpen?: () => void }) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={() => { onOpen?.(); openSong(song.slug); }}
      style={({ pressed }) => [styles.line, !first && { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth }, pressed && { backgroundColor: palette.sand }]}
      accessibilityRole="button"
      accessibilityLabel={song.title}
    >
      <Text style={[styles.lineNumber, { color: palette.accentDeep }]}>{song.order ? String(song.order).padStart(2, "0") : "—"}</Text>
      <Text numberOfLines={1} style={[styles.lineTitle, { color: palette.ink }]}>{song.title}</Text>
      {song.audioUrl ? <Ionicons name="headset" size={16} color={palette.accentDeep} /> : null}
      <Ionicons name="chevron-forward" size={18} color={palette.muted} />
    </Pressable>
  );
}

/** Today's song, opening on its first lines, with its recording when it has one. */
function SongOfTheDay({ song }: { song: Song }) {
  const { t } = useLanguage();
  const palette = usePalette();
  const { track, status, toggle } = usePlayer();
  const lines = song.paragraphs.flatMap((paragraph) => paragraph.split("\n")).map((line) => line.trim()).filter(Boolean).slice(0, 3);
  const playing = track?.url === song.audioUrl && status.playing;

  return (
    <View style={styles.section}>
      <Kicker style={styles.sectionKicker}>{t.songOfTheDay}</Kicker>
      <Pressable onPress={() => openSong(song.slug)} style={({ pressed }) => [styles.today, { backgroundColor: palette.card, borderColor: palette.line }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`${t.songOfTheDay}: ${song.title}`}>
        <View style={styles.todayHead}>
          <Text style={[styles.todayNumber, { color: palette.accentDeep }]}>{song.order ? String(song.order).padStart(2, "0") : "—"}</Text>
          <Text numberOfLines={2} style={[styles.todayTitle, { color: palette.ink }]}>{song.title}</Text>
        </View>
        <View style={[styles.verse, { borderLeftColor: palette.accent }]}>
          {lines.map((line, index) => <Text key={index} numberOfLines={1} style={[styles.verseLine, { color: palette.muted }]}>{line}</Text>)}
        </View>
        <View style={styles.todayActions}>
          <View style={[styles.read, { backgroundColor: palette.accentDeep }]}>
            <Ionicons name="book" size={17} color="#fff" />
            <Text style={styles.readText}>{t.readWords}</Text>
          </View>
          {song.audioUrl ? (
            <Pressable
              onPress={() => toggle({ slug: song.slug, title: song.title, url: song.audioUrl as string })}
              style={[styles.listen, { borderColor: palette.accentDeep }]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={playing ? t.paused : t.listenWhileReading}
            >
              <Ionicons name={playing ? "pause" : "play"} size={20} color={palette.accentDeep} />
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  flex: { flex: 1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },

  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  logo: { width: 46, height: 46, borderRadius: 23 },
  topText: { flex: 1 },
  greeting: { fontFamily: fonts.textMedium, fontSize: 13 },
  brand: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26 },
  languages: { flexDirection: "row", padding: 3, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  languageButton: { minWidth: 36, height: 32, paddingHorizontal: 8, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  languageText: { fontFamily: fonts.textBold, fontSize: 12, letterSpacing: 0.4 },

  live: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 18 },
  liveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#ff4d4d" },
  liveTitle: { color: "#fff", fontFamily: fonts.textBold, fontSize: 16 },
  liveBody: { color: "#ffffffd0", fontFamily: fonts.text, fontSize: 14, marginTop: 2 },

  find: { marginHorizontal: 12, padding: 18, paddingTop: 20, borderRadius: 26, gap: 14 },
  findField: { flexDirection: "row", alignItems: "center", gap: 10, height: 58, paddingHorizontal: 16, borderRadius: 16 },
  findInput: { flex: 1, minWidth: 0, height: "100%", fontFamily: fonts.textMedium, fontSize: 17, outlineWidth: 0 },
  results: { borderRadius: 16, overflow: "hidden" },
  noResult: { padding: 16, gap: 4 },
  noResultTitle: { fontFamily: fonts.textBold, fontSize: 15 },
  noResultHelp: { fontFamily: fonts.text, fontSize: 14 },
  seeAll: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 50, borderTopWidth: StyleSheet.hairlineWidth },
  seeAllText: { fontFamily: fonts.textBold, fontSize: 14 },

  help: { marginHorizontal: 16, marginTop: 14, padding: 16, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, gap: 12 },
  helpHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  helpTitle: { fontFamily: fonts.textBold, fontSize: 16 },
  helpStep: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  helpNumber: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  helpNumberText: { color: "#fff", fontFamily: fonts.textBold, fontSize: 13 },
  helpText: { flex: 1, fontFamily: fonts.text, fontSize: 15, lineHeight: 22 },
  gotIt: { alignSelf: "flex-start", height: 44, paddingHorizontal: 22, borderRadius: 22, alignItems: "center", justifyContent: "center", marginTop: 2 },
  gotItText: { color: "#fff", fontFamily: fonts.textBold, fontSize: 15 },

  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, marginTop: 18 },
  tile: { flexGrow: 1, flexBasis: "45%", minHeight: 138, padding: 16, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
  tileIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  tileLabel: { fontFamily: fonts.textBold, fontSize: 16, lineHeight: 21 },
  tileDetail: { fontFamily: fonts.text, fontSize: 13 },

  section: { marginTop: 26, paddingHorizontal: 16 },
  sectionKicker: { marginBottom: 10 },
  list: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  line: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 58, paddingHorizontal: 16 },
  lineNumber: { width: 34, fontFamily: fonts.display, fontSize: 21, fontVariant: ["tabular-nums"] },
  lineTitle: { flex: 1, fontFamily: fonts.textBold, fontSize: 15 },

  today: { padding: 18, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, gap: 14 },
  todayHead: { flexDirection: "row", alignItems: "center", gap: 14 },
  todayNumber: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38 },
  todayTitle: { flex: 1, fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  verse: { borderLeftWidth: 3, paddingLeft: 12, gap: 3 },
  verseLine: { fontFamily: fonts.text, fontSize: 15, lineHeight: 22 },
  todayActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  read: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 25 },
  readText: { color: "#fff", fontFamily: fonts.textBold, fontSize: 15 },
  listen: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, type NativeScrollEvent, type NativeSyntheticEvent, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { Body, Heading, Kicker, Screen, SearchField, StatusNote } from "@/components/ui";
import { useContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { normalizeSearch } from "@/lib/search";
import { fonts, usePalette, type Palette } from "@/lib/theme";
import type { Song } from "@/lib/types";

type Filter = "all" | "audio";
type Order = "number" | "letter";
type Section = { letter: string; songs: Song[] };

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

  // A–Z: a group under each letter, "#" last.
  const sections = useMemo<Section[]>(() => {
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
      .map(([letter, list]) => ({ letter, songs: list }));
  }, [songs, order]);

  // Where each letter's group starts, measured as it lays out. A pinned
  // heading is measured inside its own wrapper, so the group beneath it is
  // measured instead, less the heading's height.
  const offsets = useRef<Record<string, number>>({});
  const headingHeight = useRef(0);
  const [active, setActive] = useState("");
  const jumpTo = (letter: string, animated: boolean) => {
    const y = offsets.current[letter];
    if (y === undefined) return;
    setActive(letter);
    scrollRef.current?.scrollTo({ y: Math.max(0, y - headingHeight.current), animated });
  };
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (order !== "letter") return;
    const y = event.nativeEvent.contentOffset.y + headingHeight.current + 4;
    let current = sections[0]?.letter ?? "";
    for (const section of sections) {
      if ((offsets.current[section.letter] ?? Infinity) <= y) current = section.letter;
    }
    if (current !== active) setActive(current);
  };

  // Children of the scroll: the header, then each heading and its card; the
  // headings stay pinned while their songs pass beneath.
  const sticky = order === "letter" ? sections.map((_, index) => 1 + index * 2) : [];

  return (
    <Screen>
      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={sticky}
        onScroll={onScroll}
        scrollEventThrottle={32}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={status === "checking"} onRefresh={() => void refresh()} tintColor={palette.accent} />}
        contentContainerStyle={[styles.list, order === "letter" && styles.listWithRail]}
      >
        <View style={[styles.hero, { backgroundColor: palette.dark }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroTitle}>
              <Kicker light>{t.songbookCount(content.songs.length)}</Kicker>
              <Heading light size={40} style={styles.title}>{t.songbook}</Heading>
            </View>
            <View style={[styles.heroSeal, { borderColor: palette.darkSoft }]}>
              <Text style={[styles.heroSealNumber, { color: palette.onDark }]}>{content.songs.length}</Text>
              <Ionicons name="musical-notes" size={13} color={palette.accent} />
            </View>
          </View>
          <SearchField value={query} onChange={setQuery} placeholder={t.searchSongs} autoFocus={focus === "1"} />
          <View style={styles.controls}>
            <Segmented
              palette={palette}
              value={order}
              onChange={setOrder}
              options={[
                { value: "number", label: t.byNumber, icon: "list" },
                { value: "letter", label: t.byLetter, icon: "text" },
              ]}
            />
            {withAudio && (
              <Pressable
                onPress={() => setFilter(filter === "audio" ? "all" : "audio")}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === "audio" }}
                accessibilityLabel={t.withRecording}
                style={[styles.audioToggle, { borderColor: palette.darkSoft }, filter === "audio" && { backgroundColor: palette.accent, borderColor: palette.accent }]}
              >
                <Ionicons name="headset" size={17} color={filter === "audio" ? palette.dark : palette.onDark} />
              </Pressable>
            )}
          </View>
          <StatusNote />
        </View>

        {songs.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: palette.sand }]}><Ionicons name="search" size={26} color={palette.accentDeep} /></View>
            <Heading size={24} style={styles.emptyTitle}>{t.noSong}</Heading>
            <Body muted>{t.noSongHelp}</Body>
          </View>
        ) : order === "number" ? (
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.line }]}>
            {songs.map((song, index) => <SongRow key={song.slug} song={song} first={index === 0} />)}
          </View>
        ) : (
          sections.flatMap((section) => [
            <View
              key={`h-${section.letter}`}
              onLayout={(event) => { headingHeight.current = event.nativeEvent.layout.height; }}
              style={[styles.letterHeading, { backgroundColor: palette.page }]}
            >
              <Text style={[styles.letter, { color: palette.accentDeep }]}>{section.letter}</Text>
              <View style={[styles.letterRule, { backgroundColor: palette.line }]} />
              <View style={[styles.letterCount, { backgroundColor: palette.sand }]}>
                <Text style={[styles.letterCountText, { color: palette.muted }]}>{section.songs.length}</Text>
              </View>
            </View>,
            <View
              key={`g-${section.letter}`}
              onLayout={(event) => { offsets.current[section.letter] = event.nativeEvent.layout.y; }}
              style={[styles.card, styles.letterCard, { backgroundColor: palette.card, borderColor: palette.line }]}
            >
              {section.songs.map((song, index) => <SongRow key={song.slug} song={song} first={index === 0} />)}
            </View>,
          ])
        )}
      </ScrollView>

      {order === "letter" && sections.length > 1 && (
        <LetterRail palette={palette} letters={sections.map((section) => section.letter)} active={active} onPick={jumpTo} />
      )}
    </Screen>
  );
}

/** Two choices on one track; the chosen one is lifted out in white. */
function Segmented<Value extends string>({ palette, value, onChange, options }: {
  palette: Palette;
  value: Value;
  onChange: (value: Value) => void;
  options: { value: Value; label: string; icon: keyof typeof Ionicons.glyphMap }[];
}) {
  return (
    <View style={[styles.segmented, { backgroundColor: "rgba(255,255,255,0.08)", borderColor: palette.darkSoft }]} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && [styles.segmentSelected, { backgroundColor: palette.onDark }]]}
          >
            <Ionicons name={option.icon} size={14} color={selected ? palette.dark : palette.onDarkMuted} />
            <Text style={[styles.segmentText, { color: selected ? palette.dark : palette.onDarkMuted }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * The letters down the right edge, on a floating rail, as the phone's own
 * contacts have them: tap a letter, or hold the rail and slide along it, and
 * the list follows letter by letter while the letter shows large mid-screen.
 * The letter being read is filled in.
 */
function LetterRail({ palette, letters, active, onPick }: { palette: Palette; letters: string[]; active: string; onPick: (letter: string, animated: boolean) => void }) {
  const [shown, setShown] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fade] = useState(() => new Animated.Value(0));
  const railRef = useRef<View>(null);
  const railTop = useRef(0);
  const last = useRef("");

  useEffect(() => {
    if (!shown) return;
    fade.setValue(1);
    if (dragging) return;
    const animation = Animated.timing(fade, { toValue: 0, duration: 450, delay: 450, easing: Easing.out(Easing.quad), useNativeDriver: true });
    animation.start(({ finished }) => finished && setShown(""));
    return () => animation.stop();
  }, [shown, dragging, fade]);

  const measure = () => railRef.current?.measureInWindow((_, y) => { railTop.current = y; });
  const pickAt = (pageY: number, animated: boolean) => {
    const index = Math.min(letters.length - 1, Math.max(0, Math.floor((pageY - railTop.current - RAIL_PADDING) / RAIL_LETTER)));
    const letter = letters[index];
    if (!letter || letter === last.current) return;
    last.current = letter;
    onPick(letter, animated);
    setShown(letter);
  };
  const release = () => {
    setDragging(false);
    last.current = "";
  };

  return (
    <>
      <View style={styles.railWrap} pointerEvents="box-none">
        <View
          ref={railRef}
          onLayout={measure}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(event) => { measure(); setDragging(true); last.current = ""; pickAt(event.nativeEvent.pageY, true); }}
          onResponderMove={(event) => pickAt(event.nativeEvent.pageY, false)}
          onResponderRelease={release}
          onResponderTerminate={release}
          accessibilityRole="adjustable"
          accessibilityLabel={letters.join(" ")}
          style={[styles.rail, { backgroundColor: palette.card, borderColor: dragging ? palette.accentDeep : palette.line }, dragging && styles.railActive]}
        >
          {letters.map((letter) => {
            const on = letter === (dragging && shown ? shown : active);
            return (
              <View key={letter} pointerEvents="none" style={[styles.railLetter, on && { backgroundColor: palette.accentDeep }]}>
                <Text style={[styles.railLetterText, { color: on ? "#fff" : palette.accentDeep }]}>{letter}</Text>
              </View>
            );
          })}
        </View>
      </View>
      {shown ? (
        <Animated.View pointerEvents="none" style={[styles.bubble, { backgroundColor: palette.dark, opacity: fade, transform: [{ scale: fade.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
          <Text style={[styles.bubbleText, { color: palette.onDark }]}>{shown}</Text>
        </Animated.View>
      ) : null}
    </>
  );
}

/** Each letter's height on the rail, and the rail's padding above the first. */
const RAIL_LETTER = 18;
const RAIL_PADDING = 6;

const SongRow = memo(function SongRow({ song, first }: { song: Song; first: boolean }) {
  const palette = usePalette();
  const { t } = useLanguage();
  const number = song.order ? String(song.order).padStart(2, "0") : "—";
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/song/[slug]", params: { slug: song.slug } })}
      style={({ pressed }) => [styles.row, !first && { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth }, pressed && { backgroundColor: palette.sand }]}
      accessibilityRole="button"
      accessibilityLabel={`${number}. ${song.title}`}
    >
      <View style={styles.numberColumn}>
        <Text style={[styles.number, { color: palette.accentDeep }]}>{number}</Text>
      </View>
      <View style={[styles.numberRule, { backgroundColor: palette.line }]} />
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={[styles.songTitle, { color: palette.ink }]}>{song.title}</Text>
        <View style={styles.metaRow}>
          {song.key ? (
            <View style={styles.metaItem}>
              <Ionicons name="musical-note" size={11} color={palette.muted} />
              <Text style={[styles.meta, { color: palette.muted }]}>{song.key}</Text>
            </View>
          ) : null}
          {song.bibleReference ? (
            <View style={[styles.metaItem, styles.metaShrink]}>
              <Ionicons name="book-outline" size={11} color={palette.muted} />
              <Text numberOfLines={1} style={[styles.meta, { color: palette.muted }]}>{song.bibleReference}</Text>
            </View>
          ) : null}
          {song.status === "awaiting-review" ? <Text style={[styles.meta, { color: palette.muted }]}>{t.awaitingReview}</Text> : null}
        </View>
      </View>
      <View style={styles.badges}>
        {song.audioUrl ? (
          <View style={[styles.mediaDot, { backgroundColor: palette.accentSoft }]}><Ionicons name="headset" size={12} color={palette.accentDeep} /></View>
        ) : null}
        {song.videoId ? (
          <View style={[styles.mediaDot, { backgroundColor: palette.sand }]}><Ionicons name="play" size={11} color={palette.ink} /></View>
        ) : null}
        <Ionicons name="chevron-forward" size={15} color={palette.muted} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  list: { paddingBottom: 32 },
  listWithRail: { paddingRight: 26 },

  hero: { marginHorizontal: 12, marginTop: 8, marginBottom: 18, padding: 18, paddingTop: 20, borderRadius: 26, gap: 14, overflow: "hidden" },
  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  heroTitle: { flex: 1 },
  title: { marginTop: 6 },
  heroSeal: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  heroSealNumber: { fontFamily: fonts.display, fontSize: 22, lineHeight: 24 },
  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  segmented: { flex: 1, flexDirection: "row", padding: 4, borderRadius: 999, borderWidth: 1 },
  segment: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 36, borderRadius: 999 },
  segmentSelected: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  segmentText: { fontFamily: fonts.textBold, fontSize: 13, letterSpacing: 0.2 },
  audioToggle: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  card: { marginHorizontal: 12, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  letterCard: { marginBottom: 6 },
  letterHeading: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  letter: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, minWidth: 26 },
  letterRule: { flex: 1, height: StyleSheet.hairlineWidth },
  letterCount: { minWidth: 26, height: 22, paddingHorizontal: 8, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  letterCountText: { fontFamily: fonts.textBold, fontSize: 11 },

  row: { flexDirection: "row", alignItems: "center", minHeight: 68, paddingLeft: 6, paddingRight: 14, paddingVertical: 12 },
  numberColumn: { width: 54, alignItems: "center" },
  number: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, fontVariant: ["tabular-nums"] },
  numberRule: { width: StyleSheet.hairlineWidth, alignSelf: "stretch", marginRight: 14 },
  rowText: { flex: 1, gap: 5 },
  songTitle: { fontFamily: fonts.textBold, fontSize: 14, letterSpacing: 0.3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaShrink: { flexShrink: 1 },
  meta: { fontFamily: fonts.text, fontSize: 12 },
  badges: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 8 },
  mediaDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  railWrap: { position: "absolute", right: 4, top: 0, bottom: 0, justifyContent: "center" },
  railActive: { transform: [{ scale: 1.06 }] },
  rail: { paddingVertical: RAIL_PADDING, paddingHorizontal: 4, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  railLetter: { width: RAIL_LETTER, height: RAIL_LETTER, borderRadius: RAIL_LETTER / 2, alignItems: "center", justifyContent: "center" },
  railLetterText: { fontFamily: fonts.textBold, fontSize: 10, lineHeight: 12, userSelect: "none" },
  bubble: { position: "absolute", alignSelf: "center", top: "40%", width: 92, height: 92, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  bubbleText: { fontFamily: fonts.display, fontSize: 52, lineHeight: 58 },

  empty: { alignItems: "center", paddingHorizontal: 32, paddingTop: 30, gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  emptyTitle: { textAlign: "center" },
});

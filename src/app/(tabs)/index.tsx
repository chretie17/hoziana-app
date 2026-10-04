import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Body, Button, Heading, Kicker, Screen, SectionHeader, StatusNote } from "@/components/ui";
import { useContent } from "@/lib/content";
import { formatDate, useLanguage } from "@/lib/i18n";
import { youtubeThumbnail } from "@/lib/search";
import { fonts, usePalette } from "@/lib/theme";

const songFormats = new Set(["Official video", "Official lyric video", "Full album"]);

export default function Home() {
  const { content, status, refresh } = useContent();
  const { t, language, pick } = useLanguage();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { homepage, brand, liveBroadcast } = content;

  const releases = useMemo(
    () => content.videos.filter((video) => songFormats.has(video.format)).sort((a, b) => b.publishedOn.localeCompare(a.publishedOn)).slice(0, 8),
    [content.videos],
  );
  const cover = homepage.mode === "video" && homepage.videoId ? youtubeThumbnail(homepage.videoId) : homepage.imageUrl;
  const live = liveBroadcast.announced && liveBroadcast.videoId;

  return (
    <Screen edges={[]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={status === "checking"} onRefresh={() => void refresh()} tintColor={palette.accent} />}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.hero, { backgroundColor: palette.dark, paddingTop: insets.top + 18 }]}>
          <Image source={cover} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.dark, opacity: 0.72 }]} />
          <View style={styles.brandRow}>
            <Image source={brand.logoUrl} style={styles.logo} contentFit="cover" />
            <View>
              <Text style={styles.brandName}>{brand.name}</Text>
              <Text style={[styles.brandTagline, { color: palette.accentSoft }]}>{brand.tagline}</Text>
            </View>
          </View>
          <Kicker light style={styles.heroKicker}>{homepage.eyebrow}</Kicker>
          <Heading light size={38}>{homepage.title}</Heading>
          <Body light muted style={styles.heroBody} numberOfLines={4}>{homepage.description}</Body>
          {homepage.mode === "video" && homepage.videoId ? (
            <Button
              label={t.watchRecording}
              icon="play"
              onPress={() => router.push({ pathname: "/video/[id]", params: { id: homepage.videoId } })}
              style={styles.heroButton}
            />
          ) : null}
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

        <Pressable onPress={() => router.navigate("/songs")} style={[styles.songbook, { backgroundColor: palette.sand, borderColor: palette.line }]} accessibilityRole="button">
          <View style={[styles.songbookIcon, { backgroundColor: palette.accentDeep }]}>
            <Ionicons name="book" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Heading size={24}>{t.songbook}</Heading>
            <Body muted style={styles.small}>{t.songbookCount(content.songs.length)}</Body>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.muted} />
        </Pressable>

        <View style={styles.section}>
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
                <View style={styles.playBadge}><Ionicons name="play" size={14} color="#fff" /></View>
              </View>
              <Text numberOfLines={2} style={[styles.releaseTitle, { color: palette.ink }]}>{item.title}</Text>
              <Text style={[styles.releaseMeta, { color: palette.muted }]}>{t.formats[item.format]} · {item.publishedOn.slice(0, 4)}</Text>
            </Pressable>
          )}
        />

        {content.updates.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={t.latestNews} action={t.seeAll} onAction={() => router.navigate("/updates")} />
            {content.updates.slice(0, 2).map((post) => (
              <Pressable key={post.id} style={[styles.news, { borderColor: palette.line, backgroundColor: palette.card }]} onPress={() => router.push({ pathname: "/update/[slug]", params: { slug: post.slug } })} accessibilityRole="button">
                {post.imageUrl ? <Image source={post.imageUrl} style={styles.newsImage} contentFit="cover" transition={200} /> : null}
                <View style={styles.newsText}>
                  <Kicker>{t.categories[post.category] ?? post.category} · {formatDate(post.publishedOn, language)}</Kicker>
                  <Text numberOfLines={2} style={[styles.newsTitle, { color: palette.ink }]}>{pick(post.title)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  hero: { paddingHorizontal: 20, paddingBottom: 30, overflow: "hidden" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 46 },
  logo: { width: 46, height: 46, borderRadius: 23 },
  brandName: { color: "#fff", fontFamily: fonts.display, fontSize: 22 },
  brandTagline: { fontFamily: fonts.textBold, fontSize: 9.5, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 2 },
  heroKicker: { marginBottom: 12 },
  heroBody: { marginTop: 14 },
  heroButton: { alignSelf: "flex-start", marginTop: 22 },
  live: { flexDirection: "row", alignItems: "center", gap: 12, margin: 16, marginBottom: 0, padding: 16, borderRadius: 14 },
  liveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#ff4b4b" },
  liveTitle: { color: "#fff", fontFamily: fonts.textBold, fontSize: 15 },
  liveBody: { color: "#ffffffcc", fontFamily: fonts.text, fontSize: 13, marginTop: 2 },
  songbook: { flexDirection: "row", alignItems: "center", gap: 14, margin: 16, padding: 16, borderWidth: 1, borderRadius: 16 },
  songbookIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  small: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 18 },
  releases: { paddingHorizontal: 16, gap: 14 },
  release: { width: 220 },
  releaseImage: { width: 220, height: 124, borderRadius: 12, backgroundColor: "#0002" },
  playBadge: { position: "absolute", left: 10, bottom: 10, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#000a" },
  releaseTitle: { fontFamily: fonts.textBold, fontSize: 14, lineHeight: 19, marginTop: 9 },
  releaseMeta: { fontFamily: fonts.text, fontSize: 12, marginTop: 3 },
  news: { flexDirection: "row", gap: 12, padding: 10, borderWidth: 1, borderRadius: 14, marginBottom: 10 },
  newsImage: { width: 84, height: 84, borderRadius: 10 },
  newsText: { flex: 1, justifyContent: "center", gap: 6 },
  newsTitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
});

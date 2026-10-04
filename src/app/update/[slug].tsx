import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { Body, Heading, Kicker, Screen } from "@/components/ui";
import { useContent } from "@/lib/content";
import { formatDate, useLanguage } from "@/lib/i18n";

export default function UpdatePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { content } = useContent();
  const { t, language, pick } = useLanguage();
  const post = content.updates.find((entry) => entry.slug === slug);

  if (!post) {
    return (
      <Screen edges={[]}>
        <Body muted style={styles.missing}>{t.noUpdates}</Body>
      </Screen>
    );
  }

  const paragraphs = pick(post.body).split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: t.tabs.updates }} />
      <ScrollView contentContainerStyle={styles.content}>
        {post.imageUrl ? <Image source={post.imageUrl} accessibilityLabel={post.imageAlt} style={styles.image} contentFit="cover" transition={200} /> : null}
        <View style={styles.text}>
          <Kicker>{t.categories[post.category] ?? post.category} · {formatDate(post.publishedOn, language)}</Kicker>
          <Heading size={32} style={styles.title}>{pick(post.title)}</Heading>
          <Body muted style={styles.excerpt}>{pick(post.excerpt)}</Body>
          {paragraphs.map((paragraph, index) => (
            <Body key={index} style={styles.paragraph}>{paragraph}</Body>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  missing: { padding: 24 },
  image: { width: "100%", aspectRatio: 16 / 10 },
  text: { padding: 20 },
  title: { marginTop: 10 },
  excerpt: { fontSize: 17, lineHeight: 26, marginTop: 14 },
  paragraph: { fontSize: 16, lineHeight: 26, marginTop: 16 },
});

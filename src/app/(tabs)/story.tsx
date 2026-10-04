import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { Body, Heading, Kicker, Screen, StatusNote, type IconName } from "@/components/ui";
import { siteUrl, useContent } from "@/lib/content";
import { languages, useLanguage } from "@/lib/i18n";
import { fonts, usePalette } from "@/lib/theme";
import type { CommitteeMember } from "@/lib/types";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return `${parts[0][0] ?? ""}${parts.length > 1 ? parts[parts.length - 1][0] ?? "" : ""}`.toUpperCase();
}

export default function Story() {
  const { content, status, refresh } = useContent();
  const { t, language, setLanguage, pick } = useLanguage();
  const palette = usePalette();
  const story = content.story;
  const history = pick(story.history).split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={status === "checking"} onRefresh={() => void refresh()} tintColor={palette.accent} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.pad}>
          <Kicker>{story.kicker ? pick(story.kicker) : content.brand.tagline}</Kicker>
          <Heading size={38} style={styles.title}>
            {story.heading ? pick(story.heading) : t.ourStory}
            {story.headingAccent ? <Text style={[styles.accent, { color: palette.accentDeep }]}>{"\n"}{pick(story.headingAccent)}</Text> : null}
          </Heading>
          <StatusNote />
          {story.lead ? <Body style={[styles.paragraph, styles.lead]}>{pick(story.lead)}</Body> : null}
          {history.map((paragraph, index) => (
            <Body key={index} style={[styles.paragraph, !story.lead && index === 0 && styles.lead]}>{paragraph}</Body>
          ))}
        </View>

        {content.committee.length > 0 && (
          <View style={[styles.band, { backgroundColor: palette.sand }]}>
            <Heading size={28} style={styles.bandTitle}>{t.committee}</Heading>
            <View style={styles.grid}>
              {content.committee.map((member) => <Member key={member.id} member={member} role={pick(member.role)} />)}
            </View>
          </View>
        )}

        <View style={styles.pad}>
          <Heading size={28} style={styles.bandTitle}>{t.contact}</Heading>
          <ContactRow icon="call-outline" label={t.call} value={content.contact.phone} onPress={() => void Linking.openURL(`tel:${content.contact.phone.replace(/\s+/g, "")}`)} />
          <ContactRow icon="mail-outline" label={t.email} value={content.contact.email} onPress={() => void Linking.openURL(`mailto:${content.contact.email}`)} />
          <ContactRow icon="globe-outline" label={t.website} value={siteUrl.replace(/^https?:\/\//, "")} onPress={() => void Linking.openURL(`${siteUrl}/contact`)} />

          <Heading size={28} style={[styles.bandTitle, styles.languageTitle]}>{t.language}</Heading>
          <View style={[styles.languages, { borderColor: palette.line }]}>
            {languages.map((entry) => {
              const active = entry.code === language;
              return (
                <Pressable
                  key={entry.code}
                  onPress={() => setLanguage(entry.code)}
                  style={[styles.language, { backgroundColor: active ? palette.accentDeep : "transparent" }]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                >
                  <Text style={[styles.languageText, { color: active ? "#fff" : palette.ink }]}>{entry.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

/** A large portrait card with the name and title beneath, as on the website. */
function Member({ member, role }: { member: CommitteeMember; role: string }) {
  const palette = usePalette();
  return (
    <View style={styles.member}>
      <View style={[styles.portrait, { backgroundColor: palette.accentSoft }]}>
        {member.photoUrl ? (
          <Image source={member.photoUrl} accessibilityLabel={member.name} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ top: "25%" }} transition={200} />
        ) : (
          <Text style={[styles.initials, { color: palette.accentDeep }]}>{initials(member.name)}</Text>
        )}
      </View>
      <Text style={[styles.memberName, { color: palette.ink }]}>{member.name}</Text>
      <Text style={[styles.memberRole, { color: palette.accentDeep }]}>{role}</Text>
    </View>
  );
}

function ContactRow({ icon, label, value, onPress }: { icon: IconName; label: string; value: string; onPress: () => void }) {
  const palette = usePalette();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.contact, { borderColor: palette.line, backgroundColor: pressed ? palette.sand : palette.card }]} accessibilityRole="link">
      <View style={[styles.contactIcon, { backgroundColor: palette.sand }]}><Ionicons name={icon} size={19} color={palette.accentDeep} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.contactLabel, { color: palette.muted }]}>{label}</Text>
        <Text style={[styles.contactValue, { color: palette.ink }]}>{value}</Text>
      </View>
      <Ionicons name="arrow-forward" size={18} color={palette.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  pad: { paddingHorizontal: 20, paddingTop: 14 },
  title: { marginTop: 8, marginBottom: 6 },
  paragraph: { fontSize: 16, lineHeight: 26, marginTop: 14 },
  lead: { fontFamily: fonts.display, fontSize: 21, lineHeight: 29 },
  accent: { fontFamily: fonts.displayItalic },
  band: { marginTop: 30, paddingHorizontal: 20, paddingVertical: 28 },
  bandTitle: { marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 22 },
  member: { width: "48%" },
  portrait: { width: "100%", aspectRatio: 4 / 5, borderRadius: 12, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: fonts.display, fontSize: 40 },
  memberName: { fontFamily: fonts.display, fontSize: 19, lineHeight: 23, marginTop: 10 },
  memberRole: { fontFamily: fonts.textBold, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 },
  contact: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderWidth: 1, borderRadius: 14, marginBottom: 10 },
  contactIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  contactLabel: { fontFamily: fonts.textMedium, fontSize: 12 },
  contactValue: { fontFamily: fonts.textBold, fontSize: 14.5, marginTop: 2 },
  languageTitle: { marginTop: 24 },
  languages: { flexDirection: "row", borderWidth: 1, borderRadius: 14, padding: 4, gap: 4 },
  language: { flex: 1, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  languageText: { fontFamily: fonts.textBold, fontSize: 13 },
});

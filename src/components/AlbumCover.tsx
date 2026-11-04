import { StyleSheet, Text, View } from "react-native";

import { fonts, usePalette } from "@/lib/theme";
import type { Album } from "@/lib/types";

/**
 * A cover drawn for each album, as on the website: the volume number large,
 * or the album's name, on the choir's green, each a shade apart.
 */
export function AlbumCover({ album, index, size }: { album: Album; index: number; size: number }) {
  const palette = usePalette();
  const volume = /^Vol (\d+)$/.exec(album.title)?.[1];
  return (
    <View style={[styles.cover, { width: size, height: size, borderRadius: size * 0.12, backgroundColor: palette.accentDeep }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.dark, opacity: 0.45 + (index % 5) * 0.1 }]} />
      <View style={[styles.disc, { width: size * 0.9, height: size * 0.9, borderRadius: size * 0.45, right: -size * 0.36, bottom: -size * 0.36 }]} />
      {volume ? (
        <View style={styles.center}>
          <Text style={[styles.vol, { fontSize: Math.max(8, size * 0.08) }]}>VOL.</Text>
          <Text style={[styles.number, { fontSize: size * 0.42, lineHeight: size * 0.46 }]}>{volume.padStart(2, "0")}</Text>
        </View>
      ) : (
        <Text numberOfLines={3} style={[styles.name, { fontSize: size * 0.16, lineHeight: size * 0.18 }]}>{album.title}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
  disc: { position: "absolute", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.04)" },
  center: { alignItems: "center" },
  vol: { color: "rgba(255,255,255,0.75)", fontFamily: fonts.textBold, letterSpacing: 2 },
  number: { color: "#fff", fontFamily: fonts.display },
  name: { color: "#fff", fontFamily: fonts.display, textAlign: "center", paddingHorizontal: 8 },
});

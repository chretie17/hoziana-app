import { createElement } from "react";
import { StyleSheet, View } from "react-native";

/** The browser preview has no WebView; an iframe is the same player. */
export function YouTubePlayer({ videoId, title }: { videoId: string; title: string }) {
  return (
    <View style={styles.frame}>
      {createElement("iframe", {
        src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0&modestbranding=1`,
        title,
        allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
        allowFullScreen: true,
        style: { border: 0, width: "100%", height: "100%" },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", overflow: "hidden" },
});

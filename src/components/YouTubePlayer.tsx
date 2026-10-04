import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { siteUrl } from "@/lib/content";

/**
 * YouTube's own embedded player, so the choir's videos play inside the app
 * under YouTube's terms. The page is given the website's address as its
 * origin, which YouTube asks of embeds and which keeps playback from being
 * refused as coming from nowhere.
 */
export function YouTubePlayer({ videoId, title }: { videoId: string; title: string }) {
  const query = new URLSearchParams({ playsinline: "1", rel: "0", modestbranding: "1", origin: siteUrl });
  const source = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${query}`;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head><body><iframe src="${source}" title="${title.replace(/"/g, "&quot;")}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`;

  return (
    <View style={styles.frame}>
      <WebView
        source={{ html, baseUrl: siteUrl }}
        style={styles.web}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        scrollEnabled={false}
        // Links inside the player (the YouTube logo, end screens) open outside.
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", overflow: "hidden" },
  web: { flex: 1, backgroundColor: "#000" },
});

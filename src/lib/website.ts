import * as WebBrowser from "expo-web-browser";
import { Linking, Platform } from "react-native";

import { siteUrl } from "@/lib/content";

/**
 * Opens a page of the choir's website over the app, in the phone's own
 * browser sheet — the reader stays in the app and swipes back to it. The
 * browser preview simply opens a new tab.
 */
export async function openWebsite(path: string, tint?: string): Promise<void> {
  const url = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
  if (Platform.OS === "web") {
    window.open(url, "_blank", "noopener");
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(url, {
      controlsColor: tint,
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  } catch {
    await Linking.openURL(url);
  }
}

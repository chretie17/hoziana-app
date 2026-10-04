import { useMemo } from "react";

import { useContent } from "@/lib/content";
import type { Theme } from "@/lib/types";

/** The faces the website uses: EB Garamond for headings, Inter for text. */
export const fonts = {
  display: "EBGaramond_500Medium",
  displayItalic: "EBGaramond_500Medium_Italic",
  text: "Inter_400Regular",
  textMedium: "Inter_500Medium",
  textBold: "Inter_700Bold",
};

function channels(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16)) as [number, number, number];
}

/** `color-mix(in srgb, a share%, b)`, as the website mixes its tones. */
export function mix(a: string, b: string, share: number): string {
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  const blend = (x: number, y: number) => Math.round(x * share + y * (1 - share)).toString(16).padStart(2, "0");
  return `#${blend(ar, br)}${blend(ag, bg)}${blend(ab, bb)}`;
}

export type Palette = Theme & {
  ink: string;
  muted: string;
  line: string;
  card: string;
  onDark: string;
  onDarkMuted: string;
  darkSoft: string;
};

/**
 * The six colours chosen in Dashboard → Colours, and the tones mixed from them
 * the same way the website mixes its own — so a change there recolours the app
 * on its next check.
 */
export function usePalette(): Palette {
  const { theme } = useContent().content;
  return useMemo(
    () => ({
      ...theme,
      ink: mix(theme.dark, "#000000", 0.92),
      muted: mix(theme.dark, theme.page, 0.62),
      line: mix(theme.dark, theme.page, 0.12),
      card: "#ffffff",
      onDark: "#ffffff",
      onDarkMuted: mix("#ffffff", theme.dark, 0.62),
      darkSoft: mix(theme.dark, "#ffffff", 0.88),
    }),
    [theme],
  );
}

/**
 * Case, accents and the curly apostrophe the songbook is typed with are all
 * ignored, so "ry'isi" finds "RY’ISI" — as on the website.
 */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’ʼ`´]/g, "'")
    .toLocaleLowerCase()
    .trim();
}

export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Looser still, for words remembered from a song: punctuation, the singers'
 * marks ("Gore:", "Bose:") and repeat marks ("/2") are dropped, so a line
 * typed as it is sung is found however the songbook prints it.
 */
export function normalizeLyrics(value: string): string {
  return normalizeSearch(value)
    .replace(/^\s*(?:[ivx]+\.\s*)?(?:bose|gabo|gore|basse|mume|mke|solo|alto|soprano|tenor)\s*:\s*/gim, "")
    .replace(/\/\s*\d+/g, " ")
    .replace(/[^\p{L}\p{N}']+/gu, " ")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Each song's words, ready to search: the whole song as one run, and line by line. */
const lyricsCache = new WeakMap<object, { all: string; lines: { text: string; plain: string }[] }>();

function indexed(song: { paragraphs: readonly string[] }) {
  let entry = lyricsCache.get(song);
  if (!entry) {
    const lines = song.paragraphs
      .flatMap((paragraph) => paragraph.split("\n"))
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({
        // Shown as sung: without the singers' mark or the repeat mark.
        text: line.replace(/^(?:[IVX]+\.\s*)?(?:Bose|Gabo|Gore|Basse|Mume|Mke|Solo|Alto|Soprano|Tenor)\s*:\s*/i, "").replace(/\s*\/\s*\d+/g, "").trim(),
        plain: normalizeLyrics(line),
      }));
    entry = { all: lines.map((line) => line.plain).join(" "), lines };
    lyricsCache.set(song, entry);
  }
  return entry;
}

/**
 * The line of a song whose words contain what was typed, or null. Three
 * letters at least, so a search for a title does not fill with songs that
 * merely share a syllable. A phrase running over two lines is found too, and
 * its first line shown.
 */
export function lyricsMatch(song: { paragraphs: readonly string[] }, query: string): string | null {
  const needle = normalizeLyrics(query);
  if (needle.length < 3) return null;
  const { all, lines } = indexed(song);
  if (!all.includes(needle)) return null;
  const line = lines.find((entry) => entry.plain.includes(needle))
    ?? lines.find((entry, index) => `${entry.plain} ${lines[index + 1]?.plain ?? ""}`.includes(needle));
  return line?.text ?? lines[0]?.text ?? null;
}

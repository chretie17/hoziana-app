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

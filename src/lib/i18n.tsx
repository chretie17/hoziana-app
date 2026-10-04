import { getLocales } from "expo-localization";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { readText, writeText } from "@/lib/storage";
import type { LanguageCode, LocalizedCopy, VideoFormat } from "@/lib/types";

/** Wording reused from the website where it has the same job, so the two read alike. */
const copy = {
  rw: {
    tabs: { home: "Ahabanza", songs: "Indirimbo", listen: "Umva", updates: "Amakuru", story: "Amateka" },
    welcome: "Murakaza neza",
    latestReleases: "Videwo ziheruka",
    seeAll: "Reba zose",
    songbook: "Igitabo cy’indirimbo",
    songbookCount: (n: number) => `Indirimbo ${n} zose, ziboneka nta interineti`,
    openSongbook: "Fungura igitabo cy’indirimbo",
    searchSongs: "Shakisha umutwe, ijwi cyangwa umurongo…",
    searchVideos: "Shakisha izina ry’indirimbo…",
    noSong: "Nta ndirimbo ibonetse.",
    noSongHelp: "Gerageza indi myandikire.",
    all: "Zose",
    withRecording: "Zifite amajwi",
    key: "Ijwi",
    scripture: "Umurongo wo muri Bibiliya",
    awaitingReview: "Iracyasuzumwa",
    listenWhileReading: "Yumve uko usoma",
    watchRecording: "Reba iyi ndirimbo",
    lyrics: "Amagambo y’indirimbo",
    moreVideos: "Izindi videwo",
    textSize: "Ingano y’inyuguti",
    previousSong: "Ibanza",
    nextSong: "Ikurikira",
    liveNow: "Imbonankubone ubu",
    liveNowBody: "Hoziana iri imbonankubone. Kanda urebe.",
    officialVideos: "Videwo zemewe za Hoziana",
    sessions: "Ibiganiro byabaye imbonankubone",
    songsHeading: "Indirimbo",
    latestNews: "Amakuru mashya",
    readMore: "Soma byose",
    noUpdates: "Nta makuru mashya ubu.",
    ourStory: "Amateka yacu",
    committee: "Komite",
    contact: "Twandikire",
    call: "Hamagara",
    email: "Imeyili",
    website: "Urubuga",
    language: "Ururimi",
    offline: "Nta interineti: urabona ibyo wabitse.",
    outdatedApp: "Hari verisiyo nshya ya porogaramu. Yivugurure ubone ibishya byose.",
    updatedAt: (when: string) => `Byavuguruwe ${when}`,
    pullToRefresh: "Kurura hasi kugira ngo uvugurure",
    playing: "Irumvikana",
    paused: "Yahagaze",
    close: "Funga",
    formats: {
      "Official video": "Videwo yemewe",
      "Official lyric video": "Videwo y’amagambo",
      "Live performance": "Yafatiwe mu gitaramo",
      "Full album": "Alubumu yose",
      Short: "Agace gato",
    } as Record<VideoFormat, string>,
    categories: { Announcement: "Itangazo", Event: "Igikorwa", Ministry: "Ivugabutumwa", Music: "Umuziki", Community: "Umuryango" } as Record<string, string>,
  },
  en: {
    tabs: { home: "Home", songs: "Songs", listen: "Listen", updates: "Updates", story: "Our story" },
    welcome: "Welcome",
    latestReleases: "Latest releases",
    seeAll: "See all",
    songbook: "Songbook",
    songbookCount: (n: number) => `All ${n} songs, available offline`,
    openSongbook: "Open the songbook",
    searchSongs: "Search a title, key or Bible reference…",
    searchVideos: "Search a song title…",
    noSong: "No song found yet.",
    noSongHelp: "Try another spelling.",
    all: "All",
    withRecording: "With audio",
    key: "Key",
    scripture: "Scripture",
    awaitingReview: "Awaiting review",
    listenWhileReading: "Listen while you read",
    watchRecording: "Watch this song",
    lyrics: "Lyrics",
    moreVideos: "More recordings",
    textSize: "Text size",
    previousSong: "Previous",
    nextSong: "Next",
    liveNow: "Live now",
    liveNowBody: "Hoziana is live. Tap to watch.",
    officialVideos: "Official Hoziana recordings",
    sessions: "Past live sessions",
    songsHeading: "Songs",
    latestNews: "Latest news",
    readMore: "Read more",
    noUpdates: "No updates just now.",
    ourStory: "Our story",
    committee: "Committee",
    contact: "Connect",
    call: "Call",
    email: "Email",
    website: "Website",
    language: "Language",
    offline: "Offline: showing what is saved on this phone.",
    outdatedApp: "A newer version of the app is available. Update it to see everything.",
    updatedAt: (when: string) => `Updated ${when}`,
    pullToRefresh: "Pull down to refresh",
    playing: "Playing",
    paused: "Paused",
    close: "Close",
    formats: {
      "Official video": "Official video",
      "Official lyric video": "Lyric video",
      "Live performance": "Live performance",
      "Full album": "Full album",
      Short: "Short",
    } as Record<VideoFormat, string>,
    categories: { Announcement: "Announcement", Event: "Event", Ministry: "Ministry", Music: "Music", Community: "Community" } as Record<string, string>,
  },
  fr: {
    tabs: { home: "Accueil", songs: "Chants", listen: "Écouter", updates: "Actualités", story: "Histoire" },
    welcome: "Bienvenue",
    latestReleases: "Dernières sorties",
    seeAll: "Tout voir",
    songbook: "Recueil",
    songbookCount: (n: number) => `Les ${n} chants, disponibles hors ligne`,
    openSongbook: "Ouvrir le recueil",
    searchSongs: "Rechercher un titre, une tonalité ou un verset…",
    searchVideos: "Rechercher un titre…",
    noSong: "Aucun chant trouvé.",
    noSongHelp: "Essayez une autre orthographe.",
    all: "Tous",
    withRecording: "Avec audio",
    key: "Tonalité",
    scripture: "Écriture",
    awaitingReview: "En révision",
    listenWhileReading: "Écoutez en lisant",
    watchRecording: "Voir ce chant",
    lyrics: "Paroles",
    moreVideos: "Autres vidéos",
    textSize: "Taille du texte",
    previousSong: "Précédent",
    nextSong: "Suivant",
    liveNow: "En direct",
    liveNowBody: "Hoziana est en direct. Touchez pour regarder.",
    officialVideos: "Enregistrements officiels de Hoziana",
    sessions: "Sessions en direct passées",
    songsHeading: "Chants",
    latestNews: "Dernières nouvelles",
    readMore: "Lire la suite",
    noUpdates: "Aucune actualité pour le moment.",
    ourStory: "Notre histoire",
    committee: "Comité",
    contact: "Contact",
    call: "Appeler",
    email: "E-mail",
    website: "Site web",
    language: "Langue",
    offline: "Hors ligne : contenu enregistré sur ce téléphone.",
    outdatedApp: "Une nouvelle version de l’application est disponible. Mettez-la à jour pour tout voir.",
    updatedAt: (when: string) => `Mis à jour ${when}`,
    pullToRefresh: "Tirez vers le bas pour actualiser",
    playing: "Lecture",
    paused: "En pause",
    close: "Fermer",
    formats: {
      "Official video": "Vidéo officielle",
      "Official lyric video": "Vidéo des paroles",
      "Live performance": "En concert",
      "Full album": "Album complet",
      Short: "Extrait",
    } as Record<VideoFormat, string>,
    categories: { Announcement: "Annonce", Event: "Événement", Ministry: "Ministère", Music: "Musique", Community: "Communauté" } as Record<string, string>,
  },
};

export type Copy = (typeof copy)["en"];

export const languages: { code: LanguageCode; label: string }[] = [
  { code: "rw", label: "Kinyarwanda" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

const languageFile = "language.txt";

/** The phone's own language when the app speaks it, Kinyarwanda otherwise. */
function deviceLanguage(): LanguageCode {
  for (const locale of getLocales()) {
    const code = locale.languageCode;
    if (code === "rw" || code === "en" || code === "fr") return code;
  }
  return "rw";
}

type LanguageState = {
  language: LanguageCode;
  t: Copy;
  setLanguage: (code: LanguageCode) => void;
  /** The visitor's language, or the first other one written. */
  pick: (value: LocalizedCopy) => string;
};

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(deviceLanguage);

  useEffect(() => {
    void readText(languageFile).then((saved) => {
      if (saved === "rw" || saved === "en" || saved === "fr") setLanguageState(saved);
    });
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    void writeText(languageFile, code);
  }, []);

  const value = useMemo<LanguageState>(
    () => ({
      language,
      t: copy[language] as Copy,
      setLanguage,
      pick: (value) => value[language] || value.rw || value.en || value.fr || "",
    }),
    [language, setLanguage],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageState {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

/** "3 Oct 2026" in the chosen language. */
export function formatDate(iso: string, language: LanguageCode): string {
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  const months = {
    rw: ["Mut", "Gas", "Wer", "Mata", "Gic", "Kam", "Nya", "Kan", "Nze", "Ukw", "Ugu", "Uku"],
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  }[language];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

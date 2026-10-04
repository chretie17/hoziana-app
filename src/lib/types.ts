/**
 * The shape of GET /api/app/content on the website — a copy of `AppContent`
 * in the website's lib/app-content.ts. The website only adds fields to it and
 * raises `schema` for anything else, so this copy stays correct for as long as
 * `schema` matches.
 */
export const supportedSchema = 1;

export type LanguageCode = "rw" | "en" | "fr";
export type LocalizedCopy = Record<LanguageCode, string>;

export type VideoFormat = "Official video" | "Official lyric video" | "Live performance" | "Full album" | "Short";

export type Video = {
  videoId: string;
  title: string;
  publishedOn: string;
  format: VideoFormat;
  youtubeUrl: string;
};

export type Song = {
  id: number;
  slug: string;
  title: string;
  order: number | null;
  key: string | null;
  bibleReference: string | null;
  status: "published" | "awaiting-review";
  paragraphs: string[];
  videoId?: string | null;
  audioUrl: string | null;
};

export type UpdatePost = {
  id: number;
  slug: string;
  publishedOn: string;
  status: "published";
  category: "Announcement" | "Event" | "Ministry" | "Music" | "Community";
  featured: boolean;
  imageUrl: string;
  imageAlt: string;
  title: LocalizedCopy;
  excerpt: LocalizedCopy;
  body: LocalizedCopy;
};

export type CommitteeMember = {
  id: number;
  name: string;
  role: LocalizedCopy;
  photoUrl: string;
};

export type Theme = {
  accent: string;
  accentDeep: string;
  accentSoft: string;
  dark: string;
  sand: string;
  page: string;
};

export type AppContent = {
  schema: number;
  updatedAt: string;
  siteUrl: string;
  brand: { logoUrl: string; name: string; tagline: string };
  theme: Theme;
  contact: { email: string; phone: string };
  homepage: {
    mode: "video" | "image";
    videoId: string;
    autoplayVideo: boolean;
    imageUrl: string;
    imageAlt: string;
    eyebrow: string;
    title: string;
    description: string;
  };
  liveBroadcast: { announced: boolean; videoId: string | null; announcedAt: string | null };
  videos: Video[];
  songs: Song[];
  updates: UpdatePost[];
  story: {
    history: LocalizedCopy;
    /** Added after the first release, so a copy saved before then lacks them. */
    kicker?: LocalizedCopy;
    heading?: LocalizedCopy;
    headingAccent?: LocalizedCopy;
    lead?: LocalizedCopy;
  };
  committee: CommitteeMember[];
  text: Record<LanguageCode, Record<string, string>>;
};

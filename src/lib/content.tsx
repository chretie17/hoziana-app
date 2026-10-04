import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import snapshot from "@/assets/content-snapshot.json";
import { readText, writeText } from "@/lib/storage";
import { supportedSchema, type AppContent } from "@/lib/types";

/** The website the app reads from; a preview build can point elsewhere. */
export const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL || "https://hoziana-choir.vercel.app").replace(/\/+$/, "");

const contentFile = "content.json";
const tagFile = "content.etag";
/** Coming back to the app after this long checks the website again. */
const recheckAfterMs = 10 * 60_000;

type Status = "idle" | "checking" | "offline" | "outdated-app";

type ContentState = {
  content: AppContent;
  status: Status;
  /** When the website last answered, whether or not anything had changed. */
  checkedAt: Date | null;
  refresh: () => Promise<void>;
};

const ContentContext = createContext<ContentState | null>(null);

function usable(value: unknown): value is AppContent {
  const candidate = value as Partial<AppContent> | null;
  return Boolean(
    candidate &&
      candidate.schema === supportedSchema &&
      Array.isArray(candidate.songs) &&
      Array.isArray(candidate.videos) &&
      candidate.theme,
  );
}

/**
 * The songbook is on the phone before anything is asked of the network: the
 * copy built into the app, replaced by the last one downloaded, replaced in
 * turn by the website's when it answers. Someone in church with no signal sees
 * every song; someone with signal sees today's.
 */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<AppContent>(snapshot as AppContent);
  const [status, setStatus] = useState<Status>("idle");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const tag = useRef<string | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(() => {
    inFlight.current ??= (async () => {
      setStatus("checking");
      try {
        const response = await fetch(`${siteUrl}/api/app/content`, {
          headers: tag.current ? { "If-None-Match": tag.current } : {},
        });
        if (response.status === 304) {
          setStatus("idle");
          setCheckedAt(new Date());
          return;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const fresh: unknown = await response.json();
        if (!usable(fresh)) {
          // A website newer than this copy of the app: keep what we have and
          // say an update is waiting, rather than show something half-read.
          setStatus((fresh as { schema?: number })?.schema !== supportedSchema ? "outdated-app" : "offline");
          return;
        }
        setContent(fresh);
        setStatus("idle");
        setCheckedAt(new Date());
        tag.current = response.headers.get("ETag");
        await writeText(contentFile, JSON.stringify(fresh));
        if (tag.current) await writeText(tagFile, tag.current);
      } catch {
        setStatus("offline");
      } finally {
        inFlight.current = null;
      }
    })();
    return inFlight.current;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [saved, savedTag] = await Promise.all([readText(contentFile), readText(tagFile)]);
      if (cancelled) return;
      if (saved) {
        try {
          const parsed: unknown = JSON.parse(saved);
          if (usable(parsed) && parsed.updatedAt >= (snapshot as AppContent).updatedAt) {
            setContent(parsed);
            tag.current = savedTag;
          }
        } catch {
          // A damaged copy is simply replaced by the next download.
        }
      }
      await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const lastCheck = useRef(0);
  useEffect(() => {
    if (checkedAt) lastCheck.current = checkedAt.getTime();
  }, [checkedAt]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && Date.now() - lastCheck.current > recheckAfterMs) void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const value = useMemo(() => ({ content, status, checkedAt, refresh }), [content, status, checkedAt, refresh]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentState {
  const value = useContext(ContentContext);
  if (!value) throw new Error("useContent must be used inside ContentProvider");
  return value;
}

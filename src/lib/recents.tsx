import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { readText, writeText } from "@/lib/storage";

const recentsFile = "recent-songs.json";
const keep = 8;

type RecentsState = {
  /** Song slugs, most recently opened first. */
  recent: string[];
  remember: (slug: string) => void;
};

const RecentsContext = createContext<RecentsState | null>(null);

/** The songs this phone opened last, so the next rehearsal starts where the last one ended. */
export function RecentsProvider({ children }: { children: ReactNode }) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    void readText(recentsFile).then((saved) => {
      if (!saved) return;
      try {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecent(parsed.filter((slug): slug is string => typeof slug === "string").slice(0, keep));
      } catch {
        // A damaged list simply starts again.
      }
    });
  }, []);

  const remember = useCallback((slug: string) => {
    setRecent((current) => {
      if (current[0] === slug) return current;
      const next = [slug, ...current.filter((entry) => entry !== slug)].slice(0, keep);
      void writeText(recentsFile, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ recent, remember }), [recent, remember]);
  return <RecentsContext.Provider value={value}>{children}</RecentsContext.Provider>;
}

export function useRecents(): RecentsState {
  const value = useContext(RecentsContext);
  if (!value) throw new Error("useRecents must be used inside RecentsProvider");
  return value;
}

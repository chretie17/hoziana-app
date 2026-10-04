import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioStatus } from "expo-audio";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useContent } from "@/lib/content";

export type Track = { slug: string; title: string; url: string };

type PlayerState = {
  track: Track | null;
  status: AudioStatus;
  /** Starts a song, or toggles it when it is already the one loaded. */
  toggle: (track: Track) => void;
  seek: (seconds: number) => void;
  stop: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

/**
 * One player for the whole app, so a song keeps going while someone moves to
 * another page, locks the phone or switches app — with its name and the
 * choir's mark on the lock screen, and the controls there.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [track, setTrack] = useState<Track | null>(null);
  const logoUrl = useContent().content.brand.logoUrl;

  useEffect(() => {
    // Keeps playing in silent mode and in the background; the lock screen
    // controls require the app to hold the audio on its own.
    void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" }).catch(() => undefined);
  }, []);

  const toggle = useCallback(
    (next: Track) => {
      if (track?.url === next.url) {
        if (player.playing) player.pause();
        else {
          if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.5)) void player.seekTo(0);
          player.play();
        }
        return;
      }
      setTrack(next);
      player.replace({ uri: next.url });
      player.play();
      try {
        player.setActiveForLockScreen(true, { title: next.title, artist: "Hoziana Choir", artworkUrl: logoUrl || undefined });
      } catch {
        // The browser preview has no lock screen; playing is what matters.
      }
    },
    [player, track, status.didJustFinish, status.duration, status.currentTime, logoUrl],
  );

  const seek = useCallback((seconds: number) => void player.seekTo(seconds), [player]);

  const stop = useCallback(() => {
    player.pause();
    try {
      player.clearLockScreenControls();
    } catch {
      // As above.
    }
    setTrack(null);
  }, [player]);

  const value = useMemo(() => ({ track, status, toggle, seek, stop }), [track, status, toggle, seek, stop]);
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerState {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("usePlayer must be used inside PlayerProvider");
  return value;
}

export function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

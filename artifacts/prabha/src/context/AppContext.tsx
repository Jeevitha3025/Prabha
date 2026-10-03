import { createContext, useContext, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { saveProfile } from "../services/api";

type Role = "entrepreneur" | "mentor" | "learner";
type AppState = {
  lang: string; role: Role | null; user: any; profile: any;
  screen: string; opportunity: any; readinessScore: number | null;
};

const AppContext = createContext<any>(null);

const saved = (key: string, fallback: any) => {
  try { const v = localStorage.getItem(`prabha-${key}`); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({
    lang:           saved("lang", "en"),
    role:           saved("role", null),
    user:           saved("user", null),
    profile:        saved("profile", {}),
    screen:         saved("user", null)
      ? (saved("role", "entrepreneur") === "entrepreneur" ? "home"
        : saved("role", "entrepreneur") === "mentor" ? "mentor-home"
        : "learning-path")
      : "splash",
    opportunity:    null,
    readinessScore: null,
  }));

  const update = (patch: Partial<AppState>) =>
    setState((cur) => {
      const next = { ...cur, ...patch };
      // Persist lightweight keys to localStorage for session restore
      (["lang", "role", "user"] as const).forEach((key) => {
        if (key in patch) localStorage.setItem(`prabha-${key}`, JSON.stringify((next as any)[key]));
      });
      // If profile changed, also push to Firestore
      if ("profile" in patch && patch.profile) {
        localStorage.setItem("prabha-profile", JSON.stringify(patch.profile));
        saveProfile(patch.profile).catch(() => {}); // non-fatal
      }
      return next;
    });

  const logout = async () => {
    try { await signOut(auth); } catch {}
    ["lang", "role", "user", "profile", "mentor-status"].forEach((k) =>
      localStorage.removeItem(`prabha-${k}`)
    );
    setState({ lang: "en", role: null, user: null, profile: {}, screen: "splash", opportunity: null, readinessScore: null });
  };

  const value = useMemo(() => ({ state, update, logout }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() { return useContext(AppContext); }
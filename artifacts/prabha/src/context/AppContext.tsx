import { createContext, useContext, useMemo, useState } from "react";

type Role = "entrepreneur" | "mentor" | "learner";
type AppState = { lang: string; role: Role | null; user: any; profile: any; screen: string; opportunity: any; readinessScore: number | null };
const AppContext = createContext<any>(null);
const saved = (key: string, fallback: any) => { try { const value = localStorage.getItem(`prabha-${key}`); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({ lang: saved("lang", "en"), role: saved("role", null), user: saved("user", null), profile: saved("profile", {}), screen: saved("user", null) ? (saved("role", "entrepreneur") === "entrepreneur" ? "home" : saved("role", "entrepreneur") === "mentor" ? "mentor-home" : "learning-path") : "splash", opportunity: null, readinessScore: null }));
  const update = (patch: Partial<AppState>) => setState((current) => {
    const next = { ...current, ...patch };
    ["lang", "role", "user", "profile"].forEach((key) => { if (key in patch) localStorage.setItem(`prabha-${key}`, JSON.stringify((next as any)[key])); });
    return next;
  });
  const logout = () => { ["lang", "role", "user", "profile", "mentor-status"].forEach((key) => localStorage.removeItem(`prabha-${key}`)); setState({ lang: "en", role: null, user: null, profile: {}, screen: "splash", opportunity: null, readinessScore: null }); };
  const value = useMemo(() => ({ state, update, logout }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() { return useContext(AppContext); }
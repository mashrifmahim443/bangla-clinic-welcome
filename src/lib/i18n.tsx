import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "./locale";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (bn: string, en: string) => string };
const LangContext = createContext<Ctx>({ lang: "bn", setLang: () => {}, t: (bn) => bn });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");
  useEffect(() => {
    const saved = localStorage.getItem("diacare-lang");
    if (saved === "en" || saved === "bn") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("diacare-lang", l);
  };
  const t = (bn: string, en: string) => (lang === "bn" ? bn : en);
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

"use client";

/**
 * Lightweight locale system. Copy lives in structured locale files
 * (messages/en.json, messages/ja.json) — nothing is machine-translated at
 * runtime. Adding a language (Nepali, Vietnamese, Chinese, Indonesian,
 * Korean) means adding messages/<locale>.json and extending SUPPORTED.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import en from "@/messages/en.json";
import ja from "@/messages/ja.json";
import type { Locale } from "@/types";

type Messages = Record<string, unknown>;

const DICTS: Record<Locale, Messages> = { en, ja };
export const SUPPORTED: Locale[] = ["en", "ja"];

function lookup(dict: Messages, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tList: (key: string) => string[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("mp.locale");
    if (saved === "ja" || saved === "en") setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem("mp.locale", l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let value = lookup(DICTS[locale], key);
      if (typeof value !== "string") value = lookup(DICTS.en, key);
      if (typeof value !== "string") return key;
      let str = value;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [locale]
  );

  const tList = useCallback(
    (key: string): string[] => {
      let value = lookup(DICTS[locale], key);
      if (!Array.isArray(value)) value = lookup(DICTS.en, key);
      return Array.isArray(value) ? (value as string[]) : [];
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tList }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

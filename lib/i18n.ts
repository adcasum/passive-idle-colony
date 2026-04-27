import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en/common.json";
import ru from "@/locales/ru/common.json";
import uk from "@/locales/uk/common.json";
import es from "@/locales/es/common.json";
import pt from "@/locales/pt/common.json";
import zh from "@/locales/zh/common.json";
import id from "@/locales/id/common.json";
import hi from "@/locales/hi/common.json";
import ja from "@/locales/ja/common.json";
import ko from "@/locales/ko/common.json";
import fr from "@/locales/fr/common.json";
import de from "@/locales/de/common.json";
import tr from "@/locales/tr/common.json";
import vi from "@/locales/vi/common.json";

export const SUPPORTED_LOCALES = [
  "en",
  "ru",
  "uk",
  "es",
  "pt",
  "zh",
  "id",
  "hi",
  "ja",
  "ko",
  "fr",
  "de",
  "tr",
  "vi",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  uk: "Українська",
  es: "Español",
  pt: "Português",
  zh: "中文",
  id: "Bahasa Indonesia",
  hi: "हिन्दी",
  ja: "日本語",
  ko: "한국어",
  fr: "Français",
  de: "Deutsch",
  tr: "Türkçe",
  vi: "Tiếng Việt",
};

const STORAGE_KEY = "@pic/locale";

const RESOURCES = {
  en: { common: en },
  ru: { common: ru },
  uk: { common: uk },
  es: { common: es },
  pt: { common: pt },
  zh: { common: zh },
  id: { common: id },
  hi: { common: hi },
  ja: { common: ja },
  ko: { common: ko },
  fr: { common: fr },
  de: { common: de },
  tr: { common: tr },
  vi: { common: vi },
} as const;

function pickInitialLocale(): Locale {
  // Use the first device locale that we support; otherwise fall back to en.
  const locales = Localization.getLocales();
  for (const l of locales) {
    const tag = (l.languageTag ?? "").toLowerCase();
    const code = (l.languageCode ?? "").toLowerCase();
    // languageTag may be "ru-RU"; check both the full tag prefix and the bare code.
    for (const supported of SUPPORTED_LOCALES) {
      if (tag === supported || tag.startsWith(`${supported}-`) || code === supported) {
        return supported;
      }
    }
    // Map zh-Hans / zh-CN / zh-TW / etc. all to zh for now (Simplified Chinese strings).
    if (tag.startsWith("zh") || code === "zh") return "zh";
  }
  return "en";
}

let initialized = false;

export async function initI18n(): Promise<Locale> {
  if (initialized) return (i18n.language as Locale) ?? "en";
  let locale: Locale = "en";
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      locale = stored as Locale;
    } else {
      locale = pickInitialLocale();
    }
  } catch {
    locale = pickInitialLocale();
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources: RESOURCES,
      lng: locale,
      fallbackLng: "en",
      defaultNS: "common",
      ns: ["common"],
      interpolation: { escapeValue: false },
      // React Native does not support Suspense for translations.
      react: { useSuspense: false },
      returnNull: false,
    });
  initialized = true;
  return locale;
}

export async function setLocale(locale: Locale): Promise<void> {
  await i18n.changeLanguage(locale);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore: persistence failures are non-fatal, runtime language still set.
  }
}

export function getLocale(): Locale {
  return ((i18n.language as Locale) ?? "en") as Locale;
}

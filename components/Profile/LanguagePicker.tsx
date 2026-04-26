import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  getLocale,
  LOCALE_LABELS,
  setLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n";

// Locales for which we wrote hand-translated copy. Everything else is
// auto-translated and gets a (machine) tag so users know expectations.
const HUMAN_REVIEWED: ReadonlySet<Locale> = new Set<Locale>(["en", "ru", "uk"]);

export function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const [current, setCurrent] = useState<Locale>(getLocale());

  const choose = async (loc: Locale) => {
    setCurrent(loc);
    await setLocale(loc);
  };

  return (
    <View>
      <Text className="text-ink text-lg font-semibold mb-1">
        {t("profile.language_section")}
      </Text>
      <Text className="text-ink-dim text-xs mb-3">
        {t("profile.language_subtitle")}
      </Text>

      <View className="gap-2">
        {SUPPORTED_LOCALES.map((loc) => {
          const isActive = current === loc || i18n.language === loc;
          const machine = !HUMAN_REVIEWED.has(loc);
          return (
            <Pressable
              key={loc}
              onPress={() => choose(loc)}
              className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
                isActive ? "border-accent bg-accent/10" : "border-border bg-bg-card"
              }`}
            >
              <View className="flex-row items-center gap-3">
                <Text
                  className={isActive ? "text-accent" : "text-ink"}
                  style={{ fontWeight: "600" }}
                >
                  {LOCALE_LABELS[loc]}
                </Text>
                {machine ? (
                  <Text className="text-ink-mute text-[11px]">
                    {t("profile.ml_tag")}
                  </Text>
                ) : null}
              </View>
              {isActive ? <Text className="text-accent">✓</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <Text className="text-ink-mute text-[11px] mt-3 leading-4">
        {t("profile.ml_disclaimer")}
      </Text>
    </View>
  );
}

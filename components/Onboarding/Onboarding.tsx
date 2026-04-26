import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/UI/Button";

const STORAGE_KEY = "passive-idle-colony:onboarded:v1";

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function Onboarding() {
  const { t } = useTranslation();
  const SLIDES: Slide[] = useMemo(
    () => [
      { emoji: "🐝", title: t("onboarding.page1_title"), body: t("onboarding.page1_body") },
      { emoji: "⏳", title: t("onboarding.page2_title"), body: t("onboarding.page2_body") },
      { emoji: "✨", title: t("onboarding.page3_title"), body: t("onboarding.page3_body") },
    ],
    [t],
  );
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && !seen) setVisible(true);
      } catch {
        // never block startup on a storage error
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (index >= SLIDES.length - 1) {
      dismiss();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const isLast = index >= SLIDES.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={dismiss}
    >
      <View className="flex-1 bg-bg">
        <View className="flex-1">
          <FlatList
            ref={listRef}
            data={SLIDES}
            keyExtractor={(_, i) => `slide-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View
                style={{ width: SCREEN_WIDTH }}
                className="items-center justify-center px-8"
              >
                <Text style={{ fontSize: 96 }}>{item.emoji}</Text>
                <Text className="text-ink text-2xl font-bold mt-4 text-center">
                  {item.title}
                </Text>
                <Text className="text-ink-dim text-base text-center mt-3 leading-6">
                  {item.body}
                </Text>
              </View>
            )}
          />
        </View>

        <View className="px-6 pb-10 pt-4">
          <View className="flex-row justify-center gap-2 mb-6">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                className={`h-2 rounded-full ${
                  i === index ? "w-6 bg-accent" : "w-2 bg-border"
                }`}
              />
            ))}
          </View>
          <Button label={isLast ? t("onboarding.get_started") : t("onboarding.next")} onPress={next} />
          {!isLast ? (
            <View className="mt-2">
              <Button label={t("onboarding.skip")} variant="ghost" onPress={dismiss} />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

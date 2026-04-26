import * as Haptics from "expo-haptics";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_BG: Record<Variant, string> = {
  primary: "bg-accent",
  secondary: "bg-bg-card",
  ghost: "bg-transparent",
  danger: "bg-red-500",
};

const VARIANT_TEXT: Record<Variant, string> = {
  // primary is golden honey; dark cocoa text reads cleanly on it.
  primary: "text-[#1A140A]",
  secondary: "text-ink",
  ghost: "text-ink",
  danger: "text-white",
};

const VARIANT_BORDER: Record<Variant, string> = {
  primary: "border-accent",
  secondary: "border-border",
  ghost: "border-border",
  danger: "border-red-500",
};

interface Props extends Omit<PressableProps, "children" | "style"> {
  label?: string;
  children?: ReactNode;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Button({
  label,
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  size = "md",
  onPress,
  className = "",
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const padding =
    size === "lg"
      ? "px-6 py-4"
      : size === "sm"
        ? "px-3 py-2"
        : "px-4 py-3";

  const fontSize = size === "lg" ? "text-lg" : size === "sm" ? "text-sm" : "text-base";

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      {...rest}
      onPress={(e) => {
        if (isDisabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
          () => undefined,
        );
        onPress?.(e);
      }}
      onPressIn={() => {
        if (isDisabled) return;
        scale.value = withSpring(0.96, { damping: 14, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      }}
      style={animStyle}
      className={`flex-row items-center justify-center rounded-2xl border ${padding} ${VARIANT_BG[variant]} ${VARIANT_BORDER[variant]} ${
        isDisabled ? "opacity-50" : ""
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#1A140A" : "#E2C99A"} />
      ) : children ? (
        children
      ) : (
        <Text className={`${VARIANT_TEXT[variant]} ${fontSize} font-semibold`}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

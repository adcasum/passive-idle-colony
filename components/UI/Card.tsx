import { LinearGradient } from "expo-linear-gradient";
import { View, type ViewProps } from "react-native";

interface Props extends ViewProps {
  className?: string;
  /** Optional radial gradient tint by resource color (subtle). */
  glow?: string;
}

export function Card({ className = "", glow, children, ...rest }: Props) {
  return (
    <View
      {...rest}
      className={`rounded-2xl bg-bg-card border border-border p-4 overflow-hidden ${className}`}
    >
      {glow ? (
        <LinearGradient
          colors={[`${glow}15`, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          pointerEvents="none"
        />
      ) : null}
      {children}
    </View>
  );
}

/**
 * Stronger gradient card — used for hero / claim / rare events.
 */
export function GradientCard({
  className = "",
  colors,
  children,
  ...rest
}: ViewProps & { className?: string; colors: [string, string] }) {
  return (
    <View
      {...rest}
      className={`rounded-2xl border border-border-strong p-4 overflow-hidden ${className}`}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

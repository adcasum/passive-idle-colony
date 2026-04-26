import { Text, View } from "react-native";

interface Props {
  /** Opacity of the pattern (0..1). Default 0.05. */
  opacity?: number;
  /** Approximate cell size in points. Default 36. */
  cell?: number;
  /** Color of the comb stroke. Default warm gold. */
  color?: string;
}

/**
 * Subtle hexagonal honeycomb backdrop. Pure RN — no SVG dependency.
 *
 * Implemented as a tiled grid of unicode hex glyphs (⬡), staggered every
 * other row to form an interlocking honeycomb. Renders absolutely positioned,
 * pointer-events disabled, so callers just drop it into a relative parent.
 */
export function HoneycombPattern({
  opacity = 0.06,
  cell = 36,
  color = "#FFC940",
}: Props) {
  // 12 rows x 12 cols comfortably covers a phone screen at cell=36.
  const rows = 14;
  const cols = 12;
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", inset: 0, opacity, overflow: "hidden" }}
    >
      {Array.from({ length: rows }).map((_, r) => (
        <View
          key={r}
          style={{
            flexDirection: "row",
            marginTop: r === 0 ? 0 : -cell * 0.42,
            paddingLeft: r % 2 === 0 ? 0 : cell * 0.5,
          }}
        >
          {Array.from({ length: cols }).map((__, c) => (
            <Text
              key={c}
              style={{
                width: cell,
                fontSize: cell,
                lineHeight: cell,
                color,
                textAlign: "center",
              }}
            >
              ⬡
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

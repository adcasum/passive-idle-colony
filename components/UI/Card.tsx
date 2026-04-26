import { View, type ViewProps } from "react-native";

interface Props extends ViewProps {
  className?: string;
}

export function Card({ className = "", children, ...rest }: Props) {
  return (
    <View
      {...rest}
      className={`rounded-2xl bg-bg-card border border-border p-4 ${className}`}
    >
      {children}
    </View>
  );
}

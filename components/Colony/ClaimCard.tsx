import { useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/UI/Button";
import { GradientCard } from "@/components/UI/Card";
import { PulseDot } from "@/components/UI/PulseDot";
import { ResourceBurst } from "@/components/UI/ResourceBurst";
import { useDailyClaim } from "@/hooks/useDailyClaim";
import { useColonyData } from "@/hooks/useColonyData";
import { fmtNum } from "@/lib/format";

// Honey-glow gradient for the active "claim ready" state.
const READY_GRADIENT: [string, string] = ["#FFC940", "#E0710A"];
// Subtle warm dark for the cooldown waiting state.
const WAITING_GRADIENT: [string, string] = ["#2A1F12", "#1A140A"];

interface Props {
  /** Show the link to history at the bottom (default true). */
  showHistoryLink?: boolean;
  onClaimed?: () => void;
}

export function ClaimCard({ onClaimed }: Props) {
  const { canClaim, remainingLabel, doClaim, cooldownHours } = useDailyClaim();
  const { pending } = useColonyData();
  const [bursting, setBursting] = useState(false);

  const handleClaim = async () => {
    const r = await doClaim();
    if (r) {
      setBursting(true);
      onClaimed?.();
    }
  };

  return (
    <GradientCard colors={canClaim ? READY_GRADIENT : WAITING_GRADIENT}>
      <View className="flex-row items-center mb-2">
        {canClaim ? <PulseDot color="#FFF4D6" size={10} /> : null}
        <Text
          className={`${canClaim ? "text-[#1A140A]" : "text-ink-mute"} text-xs tracking-widest font-bold ${canClaim ? "ml-1" : ""}`}
        >
          {canClaim ? "READY TO CLAIM" : "DAILY CLAIM"}
        </Text>
      </View>

      <Text className={`${canClaim ? "text-[#1A140A]" : "text-ink"} text-2xl font-bold mb-1`}>
        {canClaim
          ? `+${fmtNum(pending.hours)} hrs accumulated`
          : `Cooldown ${remainingLabel}`}
      </Text>

      <Text className={`${canClaim ? "text-[#1A140A]/70" : "text-ink-dim"} mb-4 text-xs`}>
        {canClaim
          ? "Tap to harvest your colony's production."
          : `Claim every ${cooldownHours}h. Max accumulation 48h.`}
      </Text>

      <View>
        <Button
          label={canClaim ? "Claim Rewards" : `Cooldown ${remainingLabel}`}
          variant={canClaim ? "primary" : "secondary"}
          disabled={!canClaim}
          onPress={handleClaim}
        />
        <ResourceBurst
          visible={bursting}
          resources={["honey", "energy", "food", "water"]}
          onDone={() => setBursting(false)}
        />
      </View>
    </GradientCard>
  );
}

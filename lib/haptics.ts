import * as Haptics from "expo-haptics";

/**
 * Semantic haptic helpers. All swallow errors so haptics never break gameplay
 * (e.g. on devices/emulators without a vibration motor).
 *
 * The Button component already fires a light tap on every press, so these
 * should be used to add a *distinct* pattern for high-value moments.
 */

const safe = (p: Promise<unknown>) => p.catch(() => undefined);

export const haptic = {
  /** Light tap. Building placed on the grid. */
  build: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /** Medium impact. Upgrade applied. */
  upgrade: () =>
    safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  /** Warning. Destructive action confirmed (demolish). */
  demolish: () =>
    safe(
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    ),

  /** Success. Daily claim succeeded. */
  claim: () =>
    safe(
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),

  /** Strong + success. Skin minted. */
  mint: () =>
    safe(
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),

  /** Error pattern. Anything that failed. */
  error: () =>
    safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),

  /** Soft tap for the per-tile tap-to-tend bonus. */
  tap: () => safe(Haptics.selectionAsync()),
};

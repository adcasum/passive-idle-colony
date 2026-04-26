/**
 * Lightweight global toast emitter — no extra deps.
 *
 * Use:
 *   import { toast } from "@/lib/toast";
 *   toast.success("Claimed +50 honey");
 *   toast.error("Not enough resources");
 *   toast.info("Mint pending...");
 *
 * The <ToastHost /> component (mounted once in _layout.tsx) subscribes to
 * this emitter and renders animated toasts at the top of the screen.
 */
export type ToastKind = "success" | "error" | "info";

export interface ToastEvent {
  id: number;
  kind: ToastKind;
  message: string;
  /** Auto-dismiss delay in ms. Defaults to 2200 for success/info, 3000 for error. */
  durationMs?: number;
}

type Listener = (e: ToastEvent) => void;

let counter = 0;
const listeners = new Set<Listener>();

function emit(kind: ToastKind, message: string, durationMs?: number) {
  counter += 1;
  const ev: ToastEvent = { id: counter, kind, message, durationMs };
  listeners.forEach((l) => l(ev));
}

export const toast = {
  success: (msg: string, durationMs?: number) =>
    emit("success", msg, durationMs),
  error: (msg: string, durationMs?: number) => emit("error", msg, durationMs),
  info: (msg: string, durationMs?: number) => emit("info", msg, durationMs),
};

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

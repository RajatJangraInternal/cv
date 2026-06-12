import type { ApplyEvent } from "@/data/deployments";

type ApplyListener = (event: ApplyEvent) => void;

/**
 * Minimal event bus connecting the apply terminal (emitter) to the 3D
 * scene (subscriber). Module-level singleton: both components live in the
 * same client bundle and there is exactly one hero per page.
 */
const listeners = new Set<ApplyListener>();

export function subscribeApply(listener: ApplyListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitApply(event: ApplyEvent): void {
  for (const listener of listeners) {
    listener(event);
  }
}

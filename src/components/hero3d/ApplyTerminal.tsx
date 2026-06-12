"use client";

import { RotateCcwIcon } from "lucide-react";
import React from "react";
import {
  APPLY_SCRIPT,
  type ApplyStep,
  DESTROY_SCRIPT,
} from "@/data/deployments";
import { emitApply, subscribeControl } from "./apply-bus";

function lineTone(line: string): string {
  if (line.startsWith("$")) return "text-foreground";
  if (line.includes("Apply complete")) return "text-emerald-400";
  if (line.includes("Destroy complete")) return "text-red-400";
  if (line.includes("Destroyed") || line.includes("Destroying"))
    return "text-red-400/80";
  if (
    line.includes("Creation complete") ||
    line.includes("Established") ||
    line.includes("Released")
  )
    return "text-brand";
  return "text-muted-foreground";
}

interface TerminalJob {
  script: readonly ApplyStep[];
  /** Monotonic counter so identical scripts can re-run. */
  n: number;
}

const REBUILD_DELAY_MS = 3000;

/**
 * Terminal panel that streams the terraform apply/destroy scripts line by
 * line and emits each step's scene event when its line lands. The destroy
 * easter egg (command menu) swaps the script; after a destroy finishes the
 * apply auto-reruns so the scene never stays empty.
 *
 * Reduced-motion users get the full transcript instantly (events fire at
 * once so the scene, if active, settles into its final state).
 */
export function ApplyTerminal() {
  const [job, setJob] = React.useState<TerminalJob>({
    script: APPLY_SCRIPT,
    n: 0,
  });
  const [visibleCount, setVisibleCount] = React.useState(0);
  const done = visibleCount >= job.script.length;
  const destroying = job.script === DESTROY_SCRIPT;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // The command-menu easter egg routes through the control channel.
  React.useEffect(
    () =>
      subscribeControl((signal) => {
        if (signal === "destroy") {
          setJob((prev) =>
            prev.script === DESTROY_SCRIPT
              ? prev
              : { script: DESTROY_SCRIPT, n: prev.n + 1 }
          );
        }
      }),
    []
  );

  React.useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let timer = 0;

    const scheduleRebuild = () => {
      timer = window.setTimeout(
        () => setJob((prev) => ({ script: APPLY_SCRIPT, n: prev.n + 1 })),
        reduced ? 1500 : REBUILD_DELAY_MS
      );
    };

    if (reduced) {
      setVisibleCount(job.script.length);
      for (const step of job.script) {
        if (step.event) emitApply(step.event);
      }
      if (job.script === DESTROY_SCRIPT) scheduleRebuild();
      return () => clearTimeout(timer);
    }

    setVisibleCount(0);
    let index = 0;

    const next = () => {
      const step = job.script[index];
      if (!step) return;
      setVisibleCount(index + 1);
      if (step.event) emitApply(step.event);
      index += 1;
      if (index < job.script.length) {
        timer = window.setTimeout(next, job.script[index].delayMs);
      } else if (job.script === DESTROY_SCRIPT) {
        scheduleRebuild();
      }
    };

    timer = window.setTimeout(next, job.script[0].delayMs);
    return () => clearTimeout(timer);
  }, [job]);

  // Keep the latest line in view inside the fixed-height panel.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `visibleCount` triggers the scroll after each new line renders.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleCount]);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-border/70 bg-card/70 text-left shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-border/60 bg-secondary/40 px-3 py-1.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-red-400/80" />
          <span className="size-2 rounded-full bg-yellow-400/80" />
          <span className="size-2 rounded-full bg-emerald-400/80" />
        </span>
        <span className="ml-1 truncate font-mono text-[10px] text-muted-foreground">
          ~/rajat-kumar/infra — terraform{destroying ? " destroy" : ""}
        </span>
        <button
          type="button"
          onClick={() =>
            setJob((prev) => ({ script: APPLY_SCRIPT, n: prev.n + 1 }))
          }
          aria-label="Replay deployment"
          className={`ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] text-brand transition-opacity hover:bg-brand/10 ${
            done && !destroying
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <RotateCcwIcon className="size-3" aria-hidden="true" />
          replay
        </button>
      </div>

      <div
        ref={scrollRef}
        aria-live="polite"
        className="h-40 overflow-hidden px-3 py-2 font-mono text-[11px] leading-relaxed sm:h-44"
      >
        {job.script.slice(0, visibleCount).map((step) => (
          <p key={step.line} className={lineTone(step.line)}>
            {step.line}
          </p>
        ))}
        {!done && (
          <span
            className="ml-0.5 inline-block h-3 w-[6px] animate-pulse bg-brand"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Full transcript for screen readers, available immediately. */}
      <div className="sr-only">
        {APPLY_SCRIPT.map((step) => (
          <p key={step.line}>{step.line}</p>
        ))}
      </div>
    </div>
  );
}

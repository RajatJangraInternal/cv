"use client";

import { RotateCcwIcon } from "lucide-react";
import React from "react";
import { APPLY_SCRIPT } from "@/data/deployments";
import { emitApply } from "./apply-bus";

function lineTone(line: string): string {
  if (line.startsWith("$")) return "text-foreground";
  if (line.includes("Apply complete")) return "text-emerald-400";
  if (line.includes("Creation complete") || line.includes("Established"))
    return "text-brand";
  return "text-muted-foreground";
}

/**
 * Terminal panel that streams the terraform-apply script line by line and
 * emits each step's scene event when its line lands. Works identically on
 * the 3D and poster paths (the scene simply may not be listening).
 *
 * Reduced-motion users get the full transcript instantly (events fire at
 * once so the scene, if active, settles into its final state).
 */
export function ApplyTerminal() {
  const [visibleCount, setVisibleCount] = React.useState(0);
  const [run, setRun] = React.useState(0);
  const done = visibleCount >= APPLY_SCRIPT.length;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` is the replay trigger — the effect restarts the sequence when it changes.
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleCount(APPLY_SCRIPT.length);
      for (const step of APPLY_SCRIPT) {
        if (step.event) emitApply(step.event);
      }
      return;
    }

    setVisibleCount(0);
    let index = 0;
    let timer = 0;

    const next = () => {
      const step = APPLY_SCRIPT[index];
      if (!step) return;
      setVisibleCount(index + 1);
      if (step.event) emitApply(step.event);
      index += 1;
      if (index < APPLY_SCRIPT.length) {
        timer = window.setTimeout(next, APPLY_SCRIPT[index].delayMs);
      }
    };

    timer = window.setTimeout(next, APPLY_SCRIPT[0].delayMs);
    return () => clearTimeout(timer);
  }, [run]);

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
          ~/rajat-kumar/infra — terraform
        </span>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          aria-label="Replay deployment"
          className={`ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] text-brand transition-opacity hover:bg-brand/10 ${
            done ? "opacity-100" : "pointer-events-none opacity-0"
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
        {APPLY_SCRIPT.slice(0, visibleCount).map((step) => (
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

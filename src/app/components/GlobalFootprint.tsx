"use client";

import dynamic from "next/dynamic";
import React from "react";

/* 3D globe is client-only; the CSS poster underneath is the loading state. */
const CloudGlobe = dynamic(
  () => import("@/components/hero3d/CloudGlobe"),
  { ssr: false }
);

const REGION_LEGEND = [
  { label: "New Delhi", note: "home base" },
  { label: "Central India", note: "Azure" },
  { label: "East US", note: "Azure / AWS" },
  { label: "West Europe", note: "Azure" },
  { label: "Southeast Asia", note: "AWS" },
] as const;

/** CSS-only globe shown while the canvas loads or if WebGL is unavailable. */
function GlobePoster() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <div className="relative size-64 rounded-full bg-[radial-gradient(circle_at_35%_30%,hsl(var(--scene-1)/0.35),transparent_55%),radial-gradient(circle_at_70%_75%,hsl(var(--scene-2)/0.25),transparent_55%)] ring-1 ring-[hsl(var(--scene-1)/0.25)]">
        <div className="absolute inset-0 rounded-full shadow-[0_0_80px_-10px_hsl(var(--scene-1)/0.5)]" />
      </div>
    </div>
  );
}

/** A render/WebGL failure quietly degrades to the CSS poster. */
class GlobeBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function GlobalFootprint() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <section
      id="global-footprint"
      aria-label="Global footprint"
      className="mx-auto mt-16 w-full max-w-5xl px-5 print:hidden"
    >
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-[11px] text-brand">
          <span
            className="size-1.5 animate-pulse rounded-full bg-brand"
            aria-hidden="true"
          />
          {"// global delivery"}
        </span>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Operating across{" "}
          <span className="bg-gradient-to-r from-brand via-brand-2 to-brand bg-clip-text text-transparent">
            global regions
          </span>
        </h2>
        <p className="mt-2 max-w-xl text-pretty font-mono text-sm text-muted-foreground">
          Supporting 100+ cloud labs and enterprise tenants across Azure &amp;
          AWS regions — provisioned as code, monitored live.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
        {/* Terminal-style chrome to match the resume panel */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-secondary/40 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-red-400/80" />
            <span className="size-2.5 rounded-full bg-yellow-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </span>
          <span className="ml-2 font-mono text-[11px] text-muted-foreground">
            ~/infra/regions — live
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-brand">
            <span
              className="size-1.5 animate-pulse rounded-full bg-emerald-400"
              aria-hidden="true"
            />
            {REGION_LEGEND.length} regions
          </span>
        </div>

        {/* Canvas stage */}
        <div className="relative h-[420px] w-full sm:h-[480px]">
          <GlobePoster />
          {mounted && (
            <GlobeBoundary>
              <CloudGlobe />
            </GlobeBoundary>
          )}
        </div>

        {/* Region legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/60 px-4 py-3">
          {REGION_LEGEND.map((r) => (
            <span
              key={r.label}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground"
            >
              <span
                className="size-1.5 rounded-full bg-brand"
                aria-hidden="true"
              />
              {r.label}
              <span className="text-muted-foreground/60">· {r.note}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

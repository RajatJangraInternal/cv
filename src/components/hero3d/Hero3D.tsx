"use client";

import dynamic from "next/dynamic";
import React from "react";
import { subscribeApply } from "./apply-bus";
import { HeroPoster } from "./HeroPoster";

const InfraScene = dynamic(() => import("./InfraScene"), {
  ssr: false,
  // No loading component: the poster underneath is the loading state.
});

/**
 * Stage 1 capability gate (per design doc): 3D only when reduced-motion is
 * off, the device is not mobile (iPads/touch laptops intentionally pass
 * through to the memory/core checks), and the hardware clears minimum
 * thresholds. `?force3d=1` bypasses everything (Lighthouse / lab runs).
 */
function deviceSupports3D(): boolean {
  if (new URLSearchParams(window.location.search).get("force3d") === "1") {
    return true;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  const nav = navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
    deviceMemory?: number;
  };
  const isMobile =
    nav.userAgentData?.mobile ?? /Mobi|Android/i.test(navigator.userAgent);
  if (isMobile) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4)
    return false;
  return true;
}

/** Chunk-load or render failure in the 3D path degrades to the poster. */
class SceneErrorBoundary extends React.Component<
  { onFail: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The hero backdrop: poster always (SSR base layer), 3D scene mounted on
 * top when the gate passes, faded in once running. All failure modes
 * (gate, chunk load, WebGL context loss) leave the poster showing.
 */
export function Hero3D() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mode, setMode] = React.useState<"poster" | "3d">("poster");
  const [sceneReady, setSceneReady] = React.useState(false);
  const [onScreen, setOnScreen] = React.useState(true);
  const [playing, setPlaying] = React.useState(true);

  React.useEffect(() => {
    if (deviceSupports3D()) setMode("3d");
  }, []);

  // Suspend rendering entirely while the hero is scrolled away.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting)
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Frameloop policy: animate while the apply sequence is running (and a
  // short settle after "complete"), then drop to demand-rendering.
  React.useEffect(() => {
    let settleTimer = 0;
    const unsubscribe = subscribeApply((event) => {
      if (event.type === "complete" || event.type === "destroyed") {
        settleTimer = window.setTimeout(() => setPlaying(false), 3000);
      } else {
        clearTimeout(settleTimer);
        setPlaying(true);
      }
    });
    return () => {
      clearTimeout(settleTimer);
      unsubscribe();
    };
  }, []);

  const frameloop = !onScreen ? "never" : playing ? "always" : "demand";
  const degrade = React.useCallback(() => {
    setSceneReady(false);
    setMode("poster");
  }, []);
  const ready = React.useCallback(() => setSceneReady(true), []);

  const posterVisible = mode !== "3d" || !sceneReady;

  return (
    <div ref={containerRef} className="absolute inset-0" aria-hidden="true">
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          posterVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <HeroPoster />
      </div>
      {mode === "3d" && (
        <SceneErrorBoundary onFail={degrade}>
          <InfraScene
            frameloop={frameloop}
            onContextLost={degrade}
            onReady={ready}
          />
        </SceneErrorBoundary>
      )}
    </div>
  );
}

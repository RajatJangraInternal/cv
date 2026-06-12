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

/** How long the scene keeps animating after each kind of event. */
const SETTLE_AFTER_COMPLETE_MS = 3000;
const SETTLE_AFTER_FOCUS_MS = 2500;

/**
 * The site's 3D backdrop. Stage 3 made it a fixed layer: it fills the
 * viewport behind the hero AND the scrolled resume content (fading as you
 * leave the hero), so section-focus events stay visible. Poster always
 * renders (SSR base layer); the 3D scene mounts on top when the gate
 * passes. All failure modes (gate, chunk load, WebGL context loss) leave
 * the poster showing. Idle battery cost is near zero: the frameloop drops
 * to demand-rendering whenever nothing is animating.
 */
export function Hero3D() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mode, setMode] = React.useState<"poster" | "3d">("poster");
  const [sceneReady, setSceneReady] = React.useState(false);
  const [playing, setPlaying] = React.useState(true);

  React.useEffect(() => {
    if (deviceSupports3D()) setMode("3d");
  }, []);

  // Fade the backdrop as the resume scrolls over it (readability first).
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const vh = window.innerHeight || 1;
      const p = Math.min(window.scrollY / vh, 1);
      el.style.opacity = String(1 - p * 0.68);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Frameloop policy: animate while the apply/destroy sequence runs or a
  // section focus is settling, then drop to demand-rendering.
  React.useEffect(() => {
    let settleTimer = 0;
    const unsubscribe = subscribeApply((event) => {
      clearTimeout(settleTimer);
      setPlaying(true);
      if (event.type === "complete" || event.type === "destroyed") {
        settleTimer = window.setTimeout(
          () => setPlaying(false),
          SETTLE_AFTER_COMPLETE_MS
        );
      } else if (event.type === "focus") {
        settleTimer = window.setTimeout(
          () => setPlaying(false),
          SETTLE_AFTER_FOCUS_MS
        );
      }
    });
    return () => {
      clearTimeout(settleTimer);
      unsubscribe();
    };
  }, []);

  const frameloop = playing ? "always" : "demand";
  const degrade = React.useCallback(() => {
    setSceneReady(false);
    setMode("poster");
  }, []);
  const ready = React.useCallback(() => setSceneReady(true), []);

  const posterVisible = mode !== "3d" || !sceneReady;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0"
      aria-hidden="true"
    >
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

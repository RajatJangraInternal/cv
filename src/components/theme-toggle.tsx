"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

/**
 * Light/dark theme toggle.
 * Follows the system color scheme by default (including live OS theme
 * changes). A manual toggle stores an override in localStorage; toggling
 * back to the system's current scheme clears the override so the site
 * resumes following the OS.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (event: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem("theme");
      } catch (_e) {
        // ignore storage failures (private mode, etc.)
      }
      // Only follow the OS while the user hasn't set a manual override.
      if (stored === null) {
        applyTheme(event.matches);
        setIsDark(event.matches);
      }
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    try {
      if (next === systemDark) {
        // Back in sync with the OS — drop the override and follow the system.
        localStorage.removeItem("theme");
      } else {
        localStorage.setItem("theme", next ? "dark" : "light");
      }
    } catch (_e) {
      // ignore storage failures (private mode, etc.)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-8 print:hidden"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {mounted && isDark ? (
        <SunIcon className="size-4" aria-hidden="true" />
      ) : (
        <MoonIcon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}

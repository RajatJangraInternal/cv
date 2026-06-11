"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

/**
 * Light/dark theme toggle.
 * Reads the initial state from the `dark` class set pre-paint in layout,
 * then persists the user's choice to localStorage.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
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

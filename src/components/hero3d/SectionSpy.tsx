"use client";

import React from "react";
import { SECTION_FOCUS } from "@/data/deployments";
import { emitApply } from "./apply-bus";

/**
 * Watches the resume section headings and emits a focus event when one
 * crosses the middle band of the viewport — the 3D backdrop leans toward
 * and pulses the matching scene object. Renders nothing.
 */
export function SectionSpy() {
  React.useEffect(() => {
    let lastTarget = "";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const match = SECTION_FOCUS.find(
            (s) => s.sectionId === entry.target.id
          );
          if (match && match.target !== lastTarget) {
            lastTarget = match.target;
            emitApply({ type: "focus", target: match.target });
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    for (const { sectionId } of SECTION_FOCUS) {
      const el = document.getElementById(sectionId);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return null;
}

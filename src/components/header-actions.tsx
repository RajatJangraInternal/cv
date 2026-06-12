"use client";

import { PrinterIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

/**
 * Screen-only action cluster shown in the header:
 * theme toggle + "Save as PDF" (browser print dialog).
 */
export function HeaderActions() {
  return (
    <div className="flex items-center gap-1.5 print:hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 font-mono text-xs"
        onClick={() => window.print()}
        aria-label="Save resume as PDF"
      >
        <PrinterIcon className="size-3.5" aria-hidden="true" />
        Save PDF
      </Button>
      <ThemeToggle />
    </div>
  );
}

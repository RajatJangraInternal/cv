import { AwardIcon, ExternalLinkIcon } from "lucide-react";
import React from "react";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import type { RESUME_DATA } from "@/data/resume-data";

type Certification = (typeof RESUME_DATA)["certifications"][number];

interface CertificationsProps {
  certifications: readonly Certification[];
}

/**
 * Certifications section component
 * Renders professional certifications as a grid of credential cards
 */
export function Certifications({ certifications }: CertificationsProps) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <Section>
      <h2 className="text-xl font-bold" id="certifications-section">
        Certifications
      </h2>
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-1"
        role="feed"
        aria-labelledby="certifications-section"
      >
        {certifications.map((cert) => (
          <article key={cert.name}>
            <Card className="cv-card group flex h-full items-start gap-3 px-4 py-3 print:border-0 print:bg-transparent print:p-1 print:shadow-none">
              <span
                className="mt-0.5 flex size-8 flex-none items-center justify-center rounded-md border border-brand/30 bg-brand/10 text-brand transition-colors group-hover:bg-brand/20 print:hidden"
                aria-hidden="true"
              >
                <AwardIcon className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="text-sm font-semibold leading-snug print:text-[12px]">
                  {cert.name.replace("Microsoft Certified: ", "")}
                </h3>
                <p className="font-mono text-[11px] text-muted-foreground print:text-[10px]">
                  {cert.issuer} · {cert.date}
                </p>
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-brand underline decoration-brand/50 underline-offset-4 transition-colors hover:text-brand-2 print:hidden"
                  aria-label={`View credential for ${cert.name}`}
                >
                  View credential
                  <ExternalLinkIcon className="size-3" aria-hidden="true" />
                </a>
              </div>
            </Card>
          </article>
        ))}
      </div>
    </Section>
  );
}

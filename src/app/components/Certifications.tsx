import { ExternalLinkIcon } from "lucide-react";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import type { RESUME_DATA } from "@/data/resume-data";

type Certification = (typeof RESUME_DATA)["certifications"][number];

interface CertificationsProps {
  certifications: readonly Certification[];
}

/**
 * Certifications section component
 * Renders a list of professional certifications with credential links
 */
export function Certifications({ certifications }: CertificationsProps) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <Section>
      <h2 className="text-xl font-bold" id="certifications-section">
        Certifications
      </h2>
      <div
        className="space-y-4 print:space-y-0"
        role="feed"
        aria-labelledby="certifications-section"
      >
        {certifications.map((cert) => (
          <article key={cert.name}>
            <Card className="cv-card px-4 py-3 print:border-0 print:bg-transparent print:p-0 print:shadow-none">
              <CardHeader className="print:space-y-1">
                <div className="flex items-center justify-between gap-x-2 text-base">
                  <h3 className="inline-flex items-center font-semibold leading-none print:text-sm">
                    {cert.name}
                  </h3>
                  <div className="text-sm tabular-nums text-muted-foreground print:text-[10px]">
                    {cert.date}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-foreground/80 print:text-[12px]">
                <span className="font-mono text-xs text-muted-foreground">
                  {cert.issuer}
                </span>
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-brand underline decoration-brand/50 underline-offset-4 transition-colors hover:text-brand-2 print:hidden"
                  aria-label={`View credential for ${cert.name}`}
                >
                  View credential
                  <ExternalLinkIcon className="size-3" aria-hidden="true" />
                </a>
              </CardContent>
            </Card>
          </article>
        ))}
      </div>
    </Section>
  );
}

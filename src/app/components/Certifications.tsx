import React from "react";
import { RESUME_DATA } from "@/data/resume-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export default function Certifications() {
  const certifications = RESUME_DATA.certifications;
  if (!certifications || certifications.length === 0) return null;
  return (
    <Section className="mb-8">
      <h2 className="text-xl font-bold" id="certifications-section">
        Certifications
      </h2>
      <div
        className="space-y-4 print:space-y-0"
        role="feed"
        aria-labelledby="certifications-section"
      >
        {certifications.map((cert, idx) => (
          <Card key={idx} className="py-1 print:py-0">
            <CardHeader className="print:space-y-1">
              <div className="flex items-center justify-between gap-x-2 text-base">
                <h3 className="inline-flex items-center font-semibold leading-none print:text-sm">
                  {cert.name}
                </h3>
                <div className="text-xs text-gray-500 tabular-nums print:text-[10px]">
                  {cert.date}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-pretty font-mono text-sm text-foreground/80 print:text-[12px]">
                <span className="text-xs text-gray-500 mr-2">
                  {cert.issuer}
                </span>
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-xs ml-2"
                >
                  View Credential
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

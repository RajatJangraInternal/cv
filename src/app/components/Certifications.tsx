import React from "react";
import { RESUME_DATA } from "@/data/resume-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export default function Certifications() {
  const certifications = RESUME_DATA.certifications;
  if (!certifications || certifications.length === 0) return null;
  return (
    <Section className="mb-8">
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Certifications</h2>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-y-3">
            {certifications.map((cert, idx) => (
              <li key={idx}>
                <div className="font-medium text-base">{cert.name}</div>
                <div className="text-sm text-gray-600">
                  {cert.issuer} &mdash; {cert.date}
                </div>
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  View Credential
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </Section>
  );
}

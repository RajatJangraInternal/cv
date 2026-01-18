import React from "react";
import { RESUME_DATA } from "@/data/resume-data";

export default function Certifications() {
  const certifications = RESUME_DATA.certifications;
  if (!certifications || certifications.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">Certifications</h2>
      <ul className="space-y-4">
        {certifications.map((cert, idx) => (
          <li key={idx} className="border-b pb-2">
            <div className="font-semibold">{cert.name}</div>
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
    </section>
  );
}

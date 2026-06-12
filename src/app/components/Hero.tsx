"use client";

import { ArrowDownIcon, FileDownIcon, MailIcon } from "lucide-react";
import React from "react";
import { ApplyTerminal } from "@/components/hero3d/ApplyTerminal";
import { Hero3D } from "@/components/hero3d/Hero3D";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { RESUME_DATA } from "@/data/resume-data";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: "About", href: "#about-section" },
  { label: "Experience", href: "#work-experience" },
  { label: "Certifications", href: "#certifications-section" },
  { label: "Projects", href: "#side-projects" },
  { label: "Education", href: "#education-section" },
  { label: "Skills", href: "#skills-section" },
] as const;

// All figures come straight from the work-experience bullets in resume-data.
const HERO_STATS = [
  { value: 40000, suffix: "+", label: "Prod deployments" },
  { value: 100, suffix: "+", label: "Cloud labs supported" },
  { value: 30, suffix: "+", label: "Global hackathons" },
  { value: 2500, suffix: "", label: "Licenses in <1 hr" },
  {
    value: RESUME_DATA.certifications.length,
    suffix: "",
    label: "Certifications",
  },
] as const;

const BUILDING_WITH = ["Azure", "AWS", "Terraform"] as const;

const TYPED_ROLES = [
  "Cloud Infrastructure & DevOps Automation Engineer",
  "Infrastructure as Code — Terraform · Bicep · ARM",
  "CI/CD & Platform Automation at Enterprise Scale",
  "L2/L3 Cloud Operations — Azure & AWS",
] as const;

/* ------------------------------------------------------------------ */
/* Count-up stat                                                       */
/* ------------------------------------------------------------------ */

function formatStat(n: number) {
  return n >= 10000 ? `${Math.round(n / 1000)}K` : n.toLocaleString("en-US");
}

function StatValue({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className="font-mono text-2xl font-bold text-brand sm:text-3xl">
      {formatStat(display)}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Typewriter role line                                                */
/* ------------------------------------------------------------------ */

function TypedRole() {
  // SSR/no-JS render shows the full first role; the cycle starts client-side.
  const [display, setDisplay] = React.useState<string>(TYPED_ROLES[0]);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let index = 0;
    let len = TYPED_ROLES[0].length;
    let deleting = true;
    let timer = 0;

    const tick = () => {
      const role = TYPED_ROLES[index];
      let delay: number;
      if (deleting) {
        len -= 1;
        if (len === 0) {
          deleting = false;
          index = (index + 1) % TYPED_ROLES.length;
          delay = 350;
        } else {
          delay = 18;
        }
        setDisplay(role.slice(0, len));
      } else {
        len += 1;
        setDisplay(TYPED_ROLES[index].slice(0, len));
        if (len === TYPED_ROLES[index].length) {
          deleting = true;
          delay = 2600;
        } else {
          delay = 38;
        }
      }
      timer = window.setTimeout(tick, delay);
    };

    timer = window.setTimeout(tick, 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <p className="min-h-[2.5rem] font-mono text-sm text-brand/90 sm:min-h-[1.75rem] sm:text-base">
      <span className="sr-only">{TYPED_ROLES[0]}</span>
      <span aria-hidden="true">
        {display}
        <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-brand" />
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Terminal status chip (bottom-left)                                  */
/* ------------------------------------------------------------------ */

function SystemStatus() {
  const [time, setTime] = React.useState<string | null>(null);

  React.useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        })
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-card/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
      <span
        className="size-1.5 animate-pulse rounded-full bg-emerald-400"
        aria-hidden="true"
      />
      All systems nominal
      <span className="text-border" aria-hidden="true">
        |
      </span>
      IST {time ?? "--:--"}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col overflow-hidden print:hidden"
      aria-label="Introduction"
    >
      <Hero3D />

      {/* Soft vignette so text stays readable over the canvas */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_95%)]"
        aria-hidden="true"
      />

      {/* Top nav */}
      <nav
        className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4"
        aria-label="Hero navigation"
      >
        <a
          href="#resume-name"
          className="font-mono text-sm font-bold tracking-tight text-brand"
        >
          &lt;{RESUME_DATA.initials} /&gt;
        </a>
        <div className="hidden items-center gap-5 font-mono text-xs text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-brand"
            >
              {link.label}
            </a>
          ))}
          <a
            href={RESUME_DATA.contact.social[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-brand"
          >
            GitHub
          </a>
          <a
            href={`mailto:${RESUME_DATA.contact.email}`}
            className="transition-colors hover:text-brand"
          >
            Contact
          </a>
        </div>
      </nav>

      {/* Center content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs text-brand">
          <span
            className="size-1.5 animate-pulse rounded-full bg-brand"
            aria-hidden="true"
          />
          {"// Cloud Consultant — Azure & AWS @ Spektra Systems"}
        </span>

        <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          Hi, I&apos;m{" "}
          <span className="bg-gradient-to-r from-brand via-brand-2 to-brand bg-clip-text text-transparent">
            {RESUME_DATA.name}
          </span>
        </h1>

        <TypedRole />

        {/* Stats */}
        <dl className="mt-2 flex flex-wrap items-start justify-center gap-x-10 gap-y-5">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <StatValue value={stat.value} suffix={stat.suffix} />
              </dd>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </dl>

        {/* Actions */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild={true}
            variant="outline"
            className="border-brand/50 font-mono text-sm text-brand hover:bg-brand/10 hover:text-brand"
          >
            <a href="#work-experience">View Experience</a>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 font-mono text-sm hover:border-brand hover:text-brand"
            onClick={() => window.print()}
          >
            <FileDownIcon className="size-4" aria-hidden="true" />
            Download Resume
          </Button>
        </div>

        {/* Currently building with */}
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-border/70 bg-card/50 px-4 py-2 backdrop-blur-sm">
          <span className="font-mono text-xs text-muted-foreground">
            🚀 Currently building with
          </span>
          {BUILDING_WITH.map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5 font-mono text-[11px] text-brand"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Socials */}
        <ul
          className="flex list-none items-center gap-2"
          aria-label="Social links"
        >
          <li>
            <Button
              asChild={true}
              variant="outline"
              size="icon"
              className="size-9 rounded-full hover:border-brand hover:text-brand"
            >
              <a
                href={RESUME_DATA.contact.social[0].url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
              >
                <GitHubIcon className="size-4" aria-hidden="true" />
              </a>
            </Button>
          </li>
          <li>
            <Button
              asChild={true}
              variant="outline"
              size="icon"
              className="size-9 rounded-full hover:border-brand hover:text-brand"
            >
              <a
                href={RESUME_DATA.contact.social[1].url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
              >
                <LinkedInIcon className="size-4" aria-hidden="true" />
              </a>
            </Button>
          </li>
          <li>
            <Button
              asChild={true}
              variant="outline"
              size="icon"
              className="size-9 rounded-full hover:border-brand hover:text-brand"
            >
              <a
                href={`mailto:${RESUME_DATA.contact.email}`}
                aria-label="Send email"
              >
                <MailIcon className="size-4" aria-hidden="true" />
              </a>
            </Button>
          </li>
        </ul>
      </div>

      {/* Bottom bar: live terraform apply narrating the 3D scene */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col items-start gap-2">
          <ApplyTerminal />
          <SystemStatus />
        </div>
        <a
          href="#about-section"
          className="group flex flex-col items-center gap-1 self-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-brand sm:self-end"
          aria-label="Scroll to resume"
        >
          Scroll
          <ArrowDownIcon
            className="size-3.5 animate-bounce"
            aria-hidden="true"
          />
        </a>
      </div>
    </section>
  );
}

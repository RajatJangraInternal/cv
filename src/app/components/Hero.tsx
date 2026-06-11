"use client";

import { ArrowDownIcon, FileDownIcon, MailIcon } from "lucide-react";
import React from "react";
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
/* Canvas backdrop: particle torus knot + starfield                    */
/* ------------------------------------------------------------------ */

function readHslVar(name: string) {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw || "199 89% 55%";
}

function HeroCanvas() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let brand = readHslVar("--brand");
    let brand2 = readHslVar("--brand-2");
    let fg = readHslVar("--foreground");

    // Re-read theme colors when the dark class flips.
    const themeObserver = new MutationObserver(() => {
      brand = readHslVar("--brand");
      brand2 = readHslVar("--brand-2");
      fg = readHslVar("--foreground");
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Torus-knot sample points (p=2, q=3) with per-point jitter.
    const KNOT_POINTS = 320;
    const knot = Array.from({ length: KNOT_POINTS }, (_, i) => {
      const t = (i / KNOT_POINTS) * Math.PI * 2;
      return {
        t,
        jitter: (Math.random() - 0.5) * 0.06,
      };
    });

    const STAR_COUNT = 110;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.8 + 0.4,
    }));

    // Bright pulses that travel along the knot.
    const pulses = [0, 0.33, 0.66].map((offset) => ({ offset }));

    const project = (
      t: number,
      jitter: number,
      rotX: number,
      rotY: number,
      scale: number,
    ) => {
      const r = 2 + Math.cos(3 * t) + jitter;
      let x = r * Math.cos(2 * t);
      let y = r * Math.sin(2 * t);
      let z = Math.sin(3 * t) + jitter;

      // rotate around Y
      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      [x, z] = [x * cy - z * sy, x * sy + z * cy];
      // rotate around X
      const cx = Math.cos(rotX);
      const sx = Math.sin(rotX);
      [y, z] = [y * cx - z * sx, y * sx + z * cx];

      const persp = 5 / (5 + z);
      return {
        x: width / 2 + x * scale * persp,
        y: height / 2 + y * scale * persp,
        depth: persp, // ~0.8 (far) .. ~1.25 (near)
      };
    };

    let raf = 0;
    let running = true;

    const draw = (now: number) => {
      const time = now / 1000;
      ctx.clearRect(0, 0, width, height);

      // Starfield
      for (const s of stars) {
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(time * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${fg} / ${0.16 * tw})`;
        ctx.fill();
      }

      const rotX = time * 0.12 + 0.5;
      const rotY = time * 0.18;
      const scale = Math.min(width, height) / 7.5;

      // Wireframe segments between consecutive knot points
      for (let i = 0; i < knot.length; i++) {
        const a = knot[i];
        const b = knot[(i + 1) % knot.length];
        const pa = project(a.t, a.jitter, rotX, rotY, scale);
        const pb = project(b.t, b.jitter, rotX, rotY, scale);
        const depth = (pa.depth + pb.depth) / 2;
        const alpha = 0.05 + (depth - 0.8) * 0.45;
        const color = i % 2 === 0 ? brand : brand2;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = `hsla(${color} / ${Math.max(alpha, 0.04)})`;
        ctx.lineWidth = depth;
        ctx.stroke();
      }

      // Knot particles
      for (let i = 0; i < knot.length; i += 2) {
        const k = knot[i];
        const p = project(k.t, k.jitter, rotX, rotY, scale);
        const alpha = 0.1 + (p.depth - 0.8) * 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.depth * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${i % 4 === 0 ? brand2 : brand} / ${alpha})`;
        ctx.fill();
      }

      // Traveling pulses with glow
      for (const pulse of pulses) {
        const t = ((time * 0.07 + pulse.offset) % 1) * Math.PI * 2;
        const p = project(t, 0, rotX, rotY, scale);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
        glow.addColorStop(0, `hsla(${brand} / 0.9)`);
        glow.addColorStop(1, `hsla(${brand} / 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      if (running && !reduced) raf = requestAnimationFrame(draw);
    };

    // Pause the animation while the hero is off-screen.
    const visObserver = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting;
      if (visible && !running) {
        running = true;
        if (!reduced) raf = requestAnimationFrame(draw);
      } else if (!visible) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    visObserver.observe(canvas);

    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      themeObserver.disconnect();
      visObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full"
      aria-hidden="true"
    />
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
        }),
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
      className="relative flex min-h-[100svh] flex-col overflow-hidden print:hidden"
      aria-label="Introduction"
    >
      <HeroCanvas />

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

        <p className="font-mono text-sm text-brand/90 sm:text-base">
          Cloud Infrastructure &amp; DevOps Automation Engineer
        </p>

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

      {/* Bottom bar */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-end justify-between px-5 pb-5">
        <SystemStatus />
        <a
          href="#about-section"
          className="group flex flex-col items-center gap-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-brand"
          aria-label="Scroll to resume"
        >
          Scroll
          <ArrowDownIcon
            className="size-3.5 animate-bounce"
            aria-hidden="true"
          />
        </a>
        <div className="w-[140px]" aria-hidden="true" />
      </div>
    </section>
  );
}

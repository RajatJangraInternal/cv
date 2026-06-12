/**
 * Static poster of the infra topology — the hero's base layer.
 *
 * Rendered unconditionally in the server HTML so the LCP element exists
 * before any client-side gating runs; the 3D canvas mounts on top and
 * fades in only when the capability gate passes. Inline SVG instead of
 * the design doc's captured screenshot for now: theme-aware via CSS vars,
 * crisp at any DPI, zero image bytes (swap for a baked PNG post-Stage 2).
 */
export function HeroPoster() {
  return (
    <svg
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <title>Stylized cloud infrastructure topology</title>
      {/* Perspective ground grid */}
      <g
        stroke="hsl(var(--border))"
        strokeWidth="1"
        opacity="0.5"
        transform="translate(600 430) scale(1 0.42) rotate(45)"
      >
        {Array.from({ length: 13 }, (_, i) => -540 + i * 90).map((p) => (
          <g key={p}>
            <line x1={p} y1={-540} x2={p} y2={540} />
            <line x1={-540} y1={p} x2={540} y2={p} />
          </g>
        ))}
      </g>

      {/* Deployment arcs */}
      <g fill="none" strokeWidth="2.5" strokeLinecap="round">
        <path
          d="M 640 470 Q 430 220 300 380"
          stroke="hsl(var(--scene-1))"
          opacity="0.55"
        />
        <path
          d="M 640 470 Q 600 170 480 300"
          stroke="hsl(var(--scene-1))"
          opacity="0.45"
        />
        <path
          d="M 640 470 Q 800 200 880 330"
          stroke="hsl(var(--scene-1))"
          opacity="0.55"
        />
        <circle cx="430" cy="295" r="5" fill="hsl(var(--scene-1))" />
        <circle cx="810" cy="265" r="5" fill="hsl(var(--scene-2))" />
      </g>

      {/* Region pads */}
      <g>
        <ellipse
          cx="640"
          cy="475"
          rx="105"
          ry="40"
          fill="hsl(var(--scene-1))"
          opacity="0.22"
        />
        <ellipse
          cx="300"
          cy="385"
          rx="80"
          ry="30"
          fill="hsl(var(--scene-2))"
          opacity="0.2"
        />
        <ellipse
          cx="480"
          cy="305"
          rx="70"
          ry="26"
          fill="hsl(var(--scene-1))"
          opacity="0.18"
        />
        <ellipse
          cx="880"
          cy="335"
          rx="80"
          ry="30"
          fill="hsl(var(--scene-2))"
          opacity="0.2"
        />
      </g>

      {/* Resource primitives (simple extruded blocks) */}
      <g stroke="hsl(var(--background))" strokeWidth="1">
        <rect
          x="615"
          y="380"
          width="52"
          height="92"
          rx="4"
          fill="hsl(var(--scene-1))"
          opacity="0.85"
        />
        <rect
          x="688"
          y="425"
          width="34"
          height="48"
          rx="3"
          fill="hsl(var(--scene-2))"
          opacity="0.8"
        />
        <rect
          x="278"
          y="320"
          width="44"
          height="62"
          rx="4"
          fill="hsl(var(--scene-1))"
          opacity="0.8"
        />
        <rect
          x="240"
          y="345"
          width="28"
          height="38"
          rx="3"
          fill="hsl(var(--scene-2))"
          opacity="0.75"
        />
        <rect
          x="462"
          y="252"
          width="38"
          height="52"
          rx="4"
          fill="hsl(var(--scene-2))"
          opacity="0.8"
        />
        <rect
          x="858"
          y="282"
          width="42"
          height="52"
          rx="4"
          fill="hsl(var(--scene-1))"
          opacity="0.8"
        />
      </g>
    </svg>
  );
}

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* Theme colors (re-read when the dark class flips, like InfraScene)   */
/* ------------------------------------------------------------------ */

interface GlobeColors {
  brand: string;
  brand2: string;
  home: string;
  label: string;
}

function readColors(): GlobeColors {
  const css = getComputedStyle(document.documentElement);
  const hsl = (name: string, fallback: string) => {
    const raw = css.getPropertyValue(name).trim() || fallback;
    const [h, s, l] = raw.split(/\s+/);
    return `hsl(${h}, ${s}, ${l})`;
  };
  return {
    brand: hsl("--scene-1", "187 95% 58%"),
    brand2: hsl("--scene-2", "160 90% 52%"),
    home: hsl("--brand", "199 89% 55%"),
    label: hsl("--muted-foreground", "330 12% 66%"),
  };
}

const DEFAULT_COLORS: GlobeColors = {
  brand: "hsl(187, 95%, 58%)",
  brand2: "hsl(160, 90%, 52%)",
  home: "hsl(199, 89%, 55%)",
  label: "hsl(330, 12%, 66%)",
};

function useGlobeColors(): GlobeColors {
  const [colors, setColors] = React.useState<GlobeColors | null>(null);
  React.useEffect(() => {
    setColors(readColors());
    const observer = new MutationObserver(() => setColors(readColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return colors ?? DEFAULT_COLORS;
}

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

const R = 2;

/** Real-world lat/lng -> point on a sphere of the given radius. */
function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Samples a great-circle path between two surface points, bulged outward. */
function greatCircle(
  aUnit: THREE.Vector3,
  bUnit: THREE.Vector3,
  lift: number,
  segments = 64
): THREE.Vector3[] {
  const omega = Math.max(aUnit.angleTo(bUnit), 1e-4);
  const sinOmega = Math.sin(omega);
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const k0 = Math.sin((1 - t) * omega) / sinOmega;
    const k1 = Math.sin(t * omega) / sinOmega;
    const dir = aUnit
      .clone()
      .multiplyScalar(k0)
      .add(bUnit.clone().multiplyScalar(k1))
      .normalize();
    const radius = R * (1 + lift * Math.sin(Math.PI * t));
    points.push(dir.multiplyScalar(radius));
  }
  return points;
}

/** Fibonacci-sphere point cloud → the "digital earth" dot matrix. */
function fibonacciSphere(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return positions;
}

/* ------------------------------------------------------------------ */
/* Region data — the same regions the InfraScene provisions            */
/* ------------------------------------------------------------------ */

interface Region {
  id: string;
  label: string;
  lat: number;
  lng: number;
  home?: boolean;
}

const REGIONS: readonly Region[] = [
  { id: "home", label: "New Delhi", lat: 28.6, lng: 77.2, home: true },
  { id: "central-india", label: "Central India", lat: 18.5, lng: 73.9 },
  { id: "east-us", label: "East US", lat: 37.5, lng: -79 },
  { id: "west-europe", label: "West Europe", lat: 52.4, lng: 4.9 },
  { id: "southeast-asia", label: "Southeast Asia", lat: 1.35, lng: 103.8 },
] as const;

const ARC_PAIRS: ReadonlyArray<[string, string]> = [
  ["home", "central-india"],
  ["home", "east-us"],
  ["home", "west-europe"],
  ["home", "southeast-asia"],
  ["east-us", "west-europe"],
  ["west-europe", "southeast-asia"],
];

/* ------------------------------------------------------------------ */
/* Canvas-texture helpers (glow sprite + text label)                   */
/* ------------------------------------------------------------------ */

function useGlowTexture(color: string): THREE.CanvasTexture {
  const texture = React.useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, color);
      g.addColorStop(0.4, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    }
    return new THREE.CanvasTexture(canvas);
  }, [color]);
  React.useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function useLabelTexture(text: string, color: string): THREE.CanvasTexture {
  const texture = React.useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = "600 40px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(text, 256, 48);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
  }, [text, color]);
  React.useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/* ------------------------------------------------------------------ */
/* Region marker: node + glow + pulse ring + floating label            */
/* ------------------------------------------------------------------ */

function RegionMarker({
  region,
  color,
  labelColor,
  phase,
}: {
  region: Region;
  color: string;
  labelColor: string;
  phase: number;
}) {
  const pingRef = React.useRef<THREE.Mesh>(null);
  const pingMatRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const glow = useGlowTexture(color);
  const labelTex = useLabelTexture(region.label, labelColor);

  const { position, quaternion, labelPos } = React.useMemo(() => {
    const pos = latLngToVec3(region.lat, region.lng, R + 0.01);
    const normal = pos.clone().normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal
    );
    const lp = pos.clone().add(normal.clone().multiplyScalar(0.34));
    return { position: pos, quaternion: quat, labelPos: lp };
  }, [region]);

  useFrame(({ clock }) => {
    const ping = pingRef.current;
    const mat = pingMatRef.current;
    if (!ping || !mat) return;
    const p = (clock.getElapsedTime() * 0.5 + phase) % 1;
    ping.scale.setScalar(1 + p * 2.6);
    mat.opacity = (1 - p) * 0.5;
  });

  return (
    <group>
      {/* Core node */}
      <mesh position={position}>
        <sphereGeometry args={[region.home ? 0.07 : 0.055, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={region.home ? 2.2 : 1.6}
        />
      </mesh>
      {/* Additive glow halo (bloom-like) */}
      <sprite position={position} scale={[0.55, 0.55, 1]}>
        <spriteMaterial
          map={glow}
          transparent={true}
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {/* Expanding surface ping */}
      <mesh position={position} quaternion={quaternion} ref={pingRef}>
        <ringGeometry args={[0.07, 0.095, 40]} />
        <meshBasicMaterial
          ref={pingMatRef}
          color={color}
          transparent={true}
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Floating label */}
      <sprite position={labelPos} scale={[1.15, 0.215, 1]}>
        <spriteMaterial map={labelTex} transparent={true} depthWrite={false} />
      </sprite>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Traffic arc: tube + travelling data packets                         */
/* ------------------------------------------------------------------ */

function TrafficArc({
  from,
  to,
  color,
  animate,
  offset,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  animate: boolean;
  offset: number;
}) {
  const packetA = React.useRef<THREE.Mesh>(null);
  const packetB = React.useRef<THREE.Mesh>(null);

  const { curve, tube } = React.useMemo(() => {
    const dist = from.distanceTo(to);
    const pts = greatCircle(
      from.clone().normalize(),
      to.clone().normalize(),
      0.18 + dist * 0.06
    );
    const c = new THREE.CatmullRomCurve3(pts);
    const t = new THREE.TubeGeometry(c, 80, 0.012, 8, false);
    return { curve: c, tube: t };
  }, [from, to]);

  React.useEffect(() => () => tube.dispose(), [tube]);

  useFrame(({ clock }) => {
    if (!animate) return;
    const base = clock.getElapsedTime() * 0.22 + offset;
    if (packetA.current) curve.getPoint(base % 1, packetA.current.position);
    if (packetB.current)
      curve.getPoint((base + 0.5) % 1, packetB.current.position);
  });

  const startPacket = animate ? offset % 1 : 0.5;

  return (
    <group>
      <mesh geometry={tube}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent={true}
          opacity={0.4}
        />
      </mesh>
      <mesh ref={packetA} position={curve.getPoint(startPacket)}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={packetB} position={curve.getPoint((startPacket + 0.5) % 1)}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Globe body: solid sphere + grid + dot matrix + atmosphere           */
/* ------------------------------------------------------------------ */

function GlobeBody({ colors }: { colors: GlobeColors }) {
  const dots = React.useMemo(() => fibonacciSphere(900, R + 0.015), []);
  return (
    <group>
      {/* Solid core */}
      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial
          color="#0a1422"
          emissive={colors.brand}
          emissiveIntensity={0.05}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* Lat/long grid */}
      <mesh>
        <sphereGeometry args={[R + 0.006, 36, 24]} />
        <meshBasicMaterial
          color={colors.brand}
          wireframe={true}
          transparent={true}
          opacity={0.08}
        />
      </mesh>
      {/* Digital dot matrix */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dots, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={colors.brand2}
          size={0.022}
          transparent={true}
          opacity={0.55}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* Fresnel atmosphere halos */}
      <mesh>
        <sphereGeometry args={[R + 0.18, 48, 48]} />
        <meshBasicMaterial
          color={colors.brand}
          transparent={true}
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[R + 0.45, 48, 48]} />
        <meshBasicMaterial
          color={colors.brand}
          transparent={true}
          opacity={0.05}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Rotating world group                                                */
/* ------------------------------------------------------------------ */

function World({ colors, animate }: { colors: GlobeColors; animate: boolean }) {
  const groupRef = React.useRef<THREE.Group>(null);

  const regionVecs = React.useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    for (const r of REGIONS) map.set(r.id, latLngToVec3(r.lat, r.lng, R + 0.01));
    return map;
  }, []);

  useFrame((_, delta) => {
    if (animate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.35, 0, 0.1]}>
      <GlobeBody colors={colors} />
      {REGIONS.map((region, i) => (
        <RegionMarker
          key={region.id}
          region={region}
          color={region.home ? colors.home : i % 2 === 0 ? colors.brand : colors.brand2}
          labelColor={colors.label}
          phase={i * 0.21}
        />
      ))}
      {ARC_PAIRS.map(([a, b], i) => {
        const from = regionVecs.get(a);
        const to = regionVecs.get(b);
        if (!from || !to) return null;
        return (
          <TrafficArc
            key={`${a}-${b}`}
            from={from}
            to={to}
            color={i % 2 === 0 ? colors.brand : colors.brand2}
            animate={animate}
            offset={i * 0.16}
          />
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

export interface CloudGlobeProps {
  onReady?: () => void;
}

export default function CloudGlobe({ onReady }: CloudGlobeProps) {
  const colors = useGlobeColors();
  const [animate, setAnimate] = React.useState(true);

  React.useEffect(() => {
    setAnimate(
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  return (
    <Canvas
      aria-hidden="true"
      frameloop={animate ? "always" : "demand"}
      dpr={[1, 2]}
      camera={{ fov: 38, position: [0, 0.4, 6.2], near: 0.5, far: 40 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      onCreated={() => onReady?.()}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.1} />
      <directionalLight position={[-5, -2, -4]} intensity={0.35} />
      <pointLight position={[0, 0, 4]} intensity={3} distance={12} />
      <World colors={colors} animate={animate} />
    </Canvas>
  );
}

"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import {
  type ApplyEvent,
  SCENE_ARCS,
  SCENE_REGIONS,
  SCENE_RESOURCES,
} from "@/data/deployments";
import { subscribeApply } from "./apply-bus";

/* ------------------------------------------------------------------ */
/* Theme colors (re-read when the dark class flips, like HeroCanvas)   */
/* ------------------------------------------------------------------ */

interface ThemeColors {
  brand: string;
  brand2: string;
  grid: string;
  gridFaint: string;
}

function readThemeColors(): ThemeColors {
  const css = getComputedStyle(document.documentElement);
  const hsl = (name: string, fallback: string) => {
    const raw = css.getPropertyValue(name).trim() || fallback;
    // "199 89% 55%" -> "hsl(199, 89%, 55%)" (THREE.Color-parsable)
    const [h, s, l] = raw.split(/\s+/);
    return `hsl(${h}, ${s}, ${l})`;
  };
  return {
    brand: hsl("--brand", "199 89% 55%"),
    brand2: hsl("--brand-2", "217 91% 66%"),
    grid: hsl("--border", "217 33% 20%"),
    gridFaint: hsl("--muted", "217 33% 16%"),
  };
}

function useThemeColors(): ThemeColors {
  const [colors, setColors] = React.useState<ThemeColors | null>(null);

  React.useEffect(() => {
    setColors(readThemeColors());
    const observer = new MutationObserver(() => setColors(readThemeColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    colors ?? {
      brand: "hsl(199, 89%, 55%)",
      brand2: "hsl(217, 91%, 66%)",
      grid: "hsl(217, 33%, 20%)",
      gridFaint: "hsl(217, 33%, 16%)",
    }
  );
}

/* ------------------------------------------------------------------ */
/* Animation timing                                                    */
/* ------------------------------------------------------------------ */

const SPAWN_MS = 650;
const ARC_DRAW_MS = 900;
const PULSE_MS = 900;

function easeOutBack(p: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2;
}

/** Map of event-target id -> ms timestamp when the event fired. */
type FiredMap = Readonly<Record<string, number>>;

function regionPosition(regionId: string): THREE.Vector3 {
  const region = SCENE_REGIONS.find((r) => r.id === regionId);
  return new THREE.Vector3(region?.x ?? 0, 0, region?.z ?? 0);
}

/* ------------------------------------------------------------------ */
/* Scene elements                                                      */
/* ------------------------------------------------------------------ */

function RegionPad({
  regionId,
  pulses,
  color,
}: {
  regionId: string;
  pulses: FiredMap;
  color: string;
}) {
  const materialRef = React.useRef<THREE.MeshStandardMaterial>(null);
  const position = React.useMemo(() => regionPosition(regionId), [regionId]);

  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;
    const firedAt = pulses[regionId];
    const since = firedAt ? performance.now() - firedAt : Number.MAX_VALUE;
    const pulse = since < PULSE_MS ? 1 - since / PULSE_MS : 0;
    mat.emissiveIntensity = 0.25 + pulse * 1.6;
  });

  return (
    <mesh position={[position.x, 0.03, position.z]}>
      <cylinderGeometry args={[1.25, 1.25, 0.06, 36]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
        transparent={true}
        opacity={0.4}
      />
    </mesh>
  );
}

function ResourceMesh({
  resourceId,
  spawned,
  color,
}: {
  resourceId: string;
  spawned: FiredMap;
  color: string;
}) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const resource = SCENE_RESOURCES.find((r) => r.id === resourceId);
  const position = React.useMemo(() => {
    if (!resource) return new THREE.Vector3();
    const base = regionPosition(resource.region);
    return new THREE.Vector3(base.x + resource.dx, 0, base.z + resource.dz);
  }, [resource]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !resource) return;
    const firedAt = spawned[resourceId];
    if (!firedAt) {
      mesh.scale.setScalar(0.0001);
      return;
    }
    const p = Math.min((performance.now() - firedAt) / SPAWN_MS, 1);
    const s = easeOutBack(p);
    mesh.scale.set(s, s, s);
    mesh.position.y = (resource.h / 2) * s + 0.06;
  });

  if (!resource) return null;

  return (
    <mesh ref={meshRef} position={[position.x, resource.h / 2, position.z]}>
      {resource.shape === "box" ? (
        <boxGeometry args={[0.7, resource.h, 0.7]} />
      ) : (
        <cylinderGeometry args={[0.38, 0.38, resource.h, 24]} />
      )}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        roughness={0.35}
        metalness={0.2}
      />
    </mesh>
  );
}

function Arc({
  arcId,
  fired,
  color,
}: {
  arcId: string;
  fired: FiredMap;
  color: string;
}) {
  const arc = SCENE_ARCS.find((a) => a.id === arcId);
  const materialRef = React.useRef<THREE.MeshStandardMaterial>(null);
  const pulseRef = React.useRef<THREE.Mesh>(null);

  const curve = React.useMemo(() => {
    if (!arc) return null;
    const from = regionPosition(arc.from);
    const to = regionPosition(arc.to);
    const mid = from
      .clone()
      .add(to)
      .multiplyScalar(0.5)
      .setY(from.distanceTo(to) * 0.35 + 1);
    return new THREE.QuadraticBezierCurve3(
      from.clone().setY(0.1),
      mid,
      to.clone().setY(0.1)
    );
  }, [arc]);

  useFrame(() => {
    const firedAt = fired[arcId];
    const mat = materialRef.current;
    const pulse = pulseRef.current;
    if (!mat || !pulse || !curve) return;
    if (!firedAt) {
      mat.opacity = 0;
      pulse.visible = false;
      return;
    }
    const since = performance.now() - firedAt;
    const draw = Math.min(since / ARC_DRAW_MS, 1);
    mat.opacity = 0.12 + draw * 0.45;
    if (since < ARC_DRAW_MS * 2) {
      pulse.visible = true;
      const t = (since / ARC_DRAW_MS) % 1;
      curve.getPoint(t, pulse.position);
    } else {
      pulse.visible = false;
    }
  });

  const tube = React.useMemo(() => {
    if (!curve) return null;
    return new THREE.TubeGeometry(curve, 36, 0.035, 6, false);
  }, [curve]);

  if (!arc || !tube) return null;

  return (
    <group>
      <mesh geometry={tube}>
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.9}
          transparent={true}
          opacity={0}
        />
      </mesh>
      <mesh ref={pulseRef} visible={false}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

/** Slow camera drift around the topology. */
function CameraRig() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const radius = 11;
    const angle = Math.sin(t * 0.08) * 0.35 + 0.45;
    camera.position.set(
      Math.sin(angle) * radius,
      6.2,
      Math.cos(angle) * radius
    );
    camera.lookAt(-0.5, 0.6, -1.5);
  });
  return null;
}

function Topology({ colors }: { colors: ThemeColors }) {
  const [fired, setFired] = React.useState<FiredMap>({});

  React.useEffect(
    () =>
      subscribeApply((event: ApplyEvent) => {
        setFired((prev) => ({ ...prev, [event.target]: performance.now() }));
      }),
    []
  );

  return (
    <group>
      <gridHelper
        args={[
          34,
          34,
          new THREE.Color(colors.grid),
          new THREE.Color(colors.gridFaint),
        ]}
      />
      {SCENE_REGIONS.map((region, i) => (
        <RegionPad
          key={region.id}
          regionId={region.id}
          pulses={fired}
          color={i % 2 === 0 ? colors.brand : colors.brand2}
        />
      ))}
      {SCENE_RESOURCES.map((resource, i) => (
        <ResourceMesh
          key={resource.id}
          resourceId={resource.id}
          spawned={fired}
          color={i % 2 === 0 ? colors.brand : colors.brand2}
        />
      ))}
      {SCENE_ARCS.map((arc) => (
        <Arc key={arc.id} arcId={arc.id} fired={fired} color={colors.brand} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

export interface InfraSceneProps {
  /** R3F frameloop policy, controlled by Hero3D. */
  frameloop: "always" | "demand" | "never";
  /** Called on WebGL context loss — Hero3D swaps to the poster path. */
  onContextLost: () => void;
  /** Called once the GL context exists — Hero3D fades the poster out. */
  onReady: () => void;
}

export default function InfraScene({
  frameloop,
  onContextLost,
  onReady,
}: InfraSceneProps) {
  const colors = useThemeColors();

  return (
    <Canvas
      aria-hidden="true"
      frameloop={frameloop}
      dpr={[1, 1.5]}
      camera={{ fov: 42, position: [9, 6.2, 7], near: 0.5, far: 60 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        onReady();
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onContextLost();
          },
          { once: true }
        );
      }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} />
      <CameraRig />
      <Topology colors={colors} />
    </Canvas>
  );
}

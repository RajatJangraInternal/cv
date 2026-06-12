"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import {
  type ApplyEvent,
  SCENE_ARCS,
  SCENE_REGIONS,
  SCENE_RESOURCES,
  type SceneResource,
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
  label: string;
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
    // The scene runs on its own cyan/teal tokens (--scene-*) so it stays
    // visually separate from the magenta brand the text uses.
    brand: hsl("--scene-1", "187 95% 58%"),
    brand2: hsl("--scene-2", "160 90% 52%"),
    grid: hsl("--border", "330 22% 19%"),
    gridFaint: hsl("--muted", "330 22% 15%"),
    label: hsl("--muted-foreground", "330 12% 66%"),
  };
}

const DEFAULT_COLORS: ThemeColors = {
  brand: "hsl(187, 95%, 58%)",
  brand2: "hsl(160, 90%, 52%)",
  grid: "hsl(330, 22%, 19%)",
  gridFaint: "hsl(330, 22%, 15%)",
  label: "hsl(330, 12%, 66%)",
};

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

  return colors ?? DEFAULT_COLORS;
}

/* ------------------------------------------------------------------ */
/* Animation timing                                                    */
/* ------------------------------------------------------------------ */

const SPAWN_MS = 650;
const DESPAWN_MS = 550;
const ARC_DRAW_MS = 900;
const PULSE_MS = 900;
const FLASH_MS = 800;
const FOCUS_HOLD_MS = 1700;

function easeOutBack(p: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2;
}

/** Per-target animation state: when it last fired and which direction. */
interface AnimEntry {
  t: number;
  dir: 1 | -1;
}
type AnimMap = Readonly<Record<string, AnimEntry>>;

/** 0 when absent, eases up to 1 on spawn, back to 0 on despawn. */
function presence(entry: AnimEntry | undefined, now: number): number {
  if (!entry) return 0;
  if (entry.dir === 1) {
    const p = Math.min((now - entry.t) / SPAWN_MS, 1);
    return easeOutBack(p);
  }
  return 1 - Math.min((now - entry.t) / DESPAWN_MS, 1);
}

/** Emissive flash envelope right after a spawn. */
function flash(entry: AnimEntry | undefined, now: number): number {
  if (!entry || entry.dir !== 1) return 0;
  return Math.max(0, 1 - (now - entry.t) / FLASH_MS);
}

function regionPosition(regionId: string): THREE.Vector3 {
  const region = SCENE_REGIONS.find((r) => r.id === regionId);
  return new THREE.Vector3(region?.x ?? 0, 0, region?.z ?? 0);
}

/** World position a camera focus event should look at, by target id. */
function targetPosition(targetId: string): THREE.Vector3 | null {
  if (targetId.startsWith("region:")) {
    return regionPosition(targetId).setY(0.5);
  }
  if (targetId.startsWith("res:")) {
    const res = SCENE_RESOURCES.find((r) => r.id === targetId);
    if (!res) return null;
    return regionPosition(res.region).add(
      new THREE.Vector3(res.dx, res.h / 2, res.dz)
    );
  }
  if (targetId.startsWith("arc:")) {
    const arc = SCENE_ARCS.find((a) => a.id === targetId);
    if (!arc) return null;
    return regionPosition(arc.from)
      .add(regionPosition(arc.to))
      .multiplyScalar(0.5)
      .setY(1.4);
  }
  return null;
}

/**
 * Apply a spawn flash to every emissive material under the group. The
 * resting intensity is remembered on the material's userData the first
 * time we touch it.
 */
function applyFlash(group: THREE.Group, amount: number): void {
  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mat = obj.material as THREE.MeshStandardMaterial;
    if (!mat.emissive) return;
    if (mat.userData.baseEmissive === undefined) {
      mat.userData.baseEmissive = mat.emissiveIntensity;
    }
    mat.emissiveIntensity = mat.userData.baseEmissive * (1 + amount * 2.2);
  });
}

/* ------------------------------------------------------------------ */
/* Ambient ember particles drifting up through the topology            */
/* ------------------------------------------------------------------ */

const PARTICLE_COUNT = 220;
const PARTICLE_CEILING = 7;

function Particles({ color }: { color: string }) {
  const pointsRef = React.useRef<THREE.Points>(null);

  const data = React.useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = Math.random() * PARTICLE_CEILING;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 2;
      speeds[i] = 0.15 + Math.random() * 0.5;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    const pos = points.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let y = pos.getY(i) + data.speeds[i] * delta;
      if (y > PARTICLE_CEILING) y = 0;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[data.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.07}
        transparent={true}
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Region: glass platform + rim ring + floating label                  */
/* ------------------------------------------------------------------ */

function RegionLabel({
  text,
  color,
  position,
}: {
  text: string;
  color: string;
  position: [number, number, number];
}) {
  const texture = React.useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = "600 44px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(text.toUpperCase(), 256, 48);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
  }, [text, color]);

  React.useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={position} scale={[2.6, 0.49, 1]}>
      <spriteMaterial
        map={texture}
        transparent={true}
        opacity={0.85}
        depthWrite={false}
      />
    </sprite>
  );
}

function GlassPlatform({
  regionId,
  label,
  pulses,
  color,
  labelColor,
}: {
  regionId: string;
  label: string;
  pulses: AnimMap;
  color: string;
  labelColor: string;
}) {
  const ringRef = React.useRef<THREE.MeshStandardMaterial>(null);
  const pingRef = React.useRef<THREE.Mesh>(null);
  const pingMatRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const position = React.useMemo(() => regionPosition(regionId), [regionId]);
  // Deterministic per-region phase so the pings don't fire in unison.
  const pingPhase = React.useMemo(
    () => Math.abs(position.x * 0.37 + position.z * 0.61) % 1,
    [position]
  );

  useFrame(({ clock }) => {
    const ring = ringRef.current;
    if (ring) {
      const entry = pulses[regionId];
      const since = entry ? performance.now() - entry.t : Number.MAX_VALUE;
      const pulse = since < PULSE_MS ? 1 - since / PULSE_MS : 0;
      ring.emissiveIntensity = 0.7 + pulse * 2.4;
    }
    // Radar ping: an expanding, fading ring on a continuous loop.
    const ping = pingRef.current;
    const pingMat = pingMatRef.current;
    if (ping && pingMat) {
      const p = (clock.getElapsedTime() * 0.32 + pingPhase) % 1;
      ping.scale.setScalar(1 + p * 1.25);
      pingMat.opacity = (1 - p) * 0.35;
    }
  });

  return (
    <group position={[position.x, 0, position.z]}>
      {/* Glass disc */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 0.08, 48]} />
        <meshPhysicalMaterial
          color={color}
          transparent={true}
          opacity={0.26}
          roughness={0.15}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.2}
        />
      </mesh>
      {/* Emissive rim ring */}
      <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.028, 10, 64]} />
        <meshStandardMaterial
          ref={ringRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
        />
      </mesh>
      {/* Expanding radar ping */}
      <mesh
        ref={pingRef}
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.3, 1.37, 48]} />
        <meshBasicMaterial
          ref={pingMatRef}
          color={color}
          transparent={true}
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <RegionLabel text={label} color={labelColor} position={[0, 0.62, 1.05]} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Resource forms                                                      */
/* ------------------------------------------------------------------ */

interface FormProps {
  h: number;
  color: string;
  altColor: string;
}

/** Hex tower with emissive core and additive rim shell (career). */
function TowerForm({ h, color }: FormProps) {
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.42, 0.48, h, 6]} />
        <meshPhysicalMaterial
          color={color}
          transparent={true}
          opacity={0.55}
          roughness={0.2}
          metalness={0.15}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.18, 0.18, h * 0.92, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.1}
        />
      </mesh>
      {/* Cheap fresnel-style rim: slightly larger backside shell */}
      <mesh position={[0, h / 2, 0]} scale={1.12}>
        <cylinderGeometry args={[0.42, 0.48, h, 6]} />
        <meshBasicMaterial
          color={color}
          transparent={true}
          opacity={0.14}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Stacked server rack with staggered LED edges (cloud labs). */
function RackForm({ h, color, altColor }: FormProps) {
  const unit = h / 3;
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, unit * i + unit / 2, 0]}>
          <mesh>
            <boxGeometry args={[0.72, unit * 0.82, 0.72]} />
            <meshStandardMaterial
              color={i === 1 ? altColor : color}
              emissive={i === 1 ? altColor : color}
              emissiveIntensity={0.3}
              roughness={0.35}
              metalness={0.25}
            />
          </mesh>
          <mesh position={[0, 0, 0.37]}>
            <boxGeometry args={[0.6, 0.04, 0.01]} />
            <meshStandardMaterial
              color={altColor}
              emissive={altColor}
              emissiveIntensity={1.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Elongated conduit with a bright light-strip spine (pipelines). */
function ConduitForm({ h, color, altColor }: FormProps) {
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[1.5, h, 0.55]} />
        <meshPhysicalMaterial
          color={color}
          transparent={true}
          opacity={0.5}
          roughness={0.25}
          clearcoat={0.8}
        />
      </mesh>
      <mesh position={[0, h + 0.02, 0]}>
        <boxGeometry args={[1.5, 0.05, 0.12]} />
        <meshStandardMaterial
          color={altColor}
          emissive={altColor}
          emissiveIntensity={1.6}
        />
      </mesh>
    </group>
  );
}

/** Triangular cluster of varied blocks (hackathons). */
function ClusterForm({ h, color, altColor }: FormProps) {
  const blocks: Array<[number, number, number, string]> = [
    [-0.32, h * 0.9, 0.1, color],
    [0.3, h * 0.6, 0.28, altColor],
    [0.02, h * 0.45, -0.32, color],
  ];
  return (
    <group>
      {blocks.map(([x, bh, z, c]) => (
        <mesh key={`${x}-${z}`} position={[x, bh / 2, z]}>
          <boxGeometry args={[0.4, bh, 0.4]} />
          <meshStandardMaterial
            color={c}
            emissive={c}
            emissiveIntensity={0.45}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Pedestal with a floating, slowly turning octahedron badge (certs). */
function BadgeForm({ h, color, altColor }: FormProps) {
  const gemRef = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const gem = gemRef.current;
    if (!gem) return;
    const t = clock.getElapsedTime();
    gem.rotation.y = t * 0.6;
    gem.position.y = h + 0.32 + Math.sin(t * 1.4) * 0.06;
  });

  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.3, 0.36, h, 18]} />
        <meshPhysicalMaterial
          color={color}
          transparent={true}
          opacity={0.5}
          roughness={0.2}
          clearcoat={1}
        />
      </mesh>
      <mesh ref={gemRef} position={[0, h + 0.32, 0]}>
        <octahedronGeometry args={[0.26]} />
        <meshStandardMaterial
          color={altColor}
          emissive={altColor}
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}

/** Core column with an orbiting halo ring (automation). */
function RingForm({ h, color, altColor }: FormProps) {
  const haloRef = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const halo = haloRef.current;
    if (!halo) return;
    const t = clock.getElapsedTime();
    halo.rotation.z = t * 0.8;
    halo.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.5) * 0.15;
  });

  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.22, 0.26, h, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.25}
          metalness={0.3}
        />
      </mesh>
      <mesh ref={haloRef} position={[0, h * 0.65, 0]}>
        <torusGeometry args={[0.5, 0.035, 8, 40]} />
        <meshStandardMaterial
          color={altColor}
          emissive={altColor}
          emissiveIntensity={1.3}
        />
      </mesh>
    </group>
  );
}

const FORMS: Record<
  SceneResource["kind"],
  (props: FormProps) => React.JSX.Element
> = {
  tower: TowerForm,
  rack: RackForm,
  conduit: ConduitForm,
  cluster: ClusterForm,
  badge: BadgeForm,
  ring: RingForm,
};

/**
 * Handles spawn/despawn scaling plus the emissive flash for any form —
 * fired both by its own spawn and by section-focus pulses.
 */
function ResourceNode({
  resource,
  anims,
  pulses,
  color,
  altColor,
}: {
  resource: SceneResource;
  anims: AnimMap;
  pulses: AnimMap;
  color: string;
  altColor: string;
}) {
  const groupRef = React.useRef<THREE.Group>(null);
  const position = React.useMemo(() => {
    const base = regionPosition(resource.region);
    return new THREE.Vector3(base.x + resource.dx, 0, base.z + resource.dz);
  }, [resource]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const now = performance.now();
    const entry = anims[resource.id];
    const s = Math.max(presence(entry, now), 0.0001);
    group.scale.setScalar(s);
    // Gentle hover-bob once present, phase-offset per resource.
    const bobPhase = position.x * 1.3 + position.z * 0.7;
    group.position.y =
      0.08 + Math.sin(clock.getElapsedTime() * 1.1 + bobPhase) * 0.045 * s;
    const glow = Math.max(flash(entry, now), flash(pulses[resource.id], now));
    applyFlash(group, glow);
  });

  const Form = FORMS[resource.kind];

  return (
    <group
      ref={groupRef}
      position={[position.x, 0.08, position.z]}
      scale={0.0001}
    >
      <Form h={resource.h} color={color} altColor={altColor} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Arcs                                                                */
/* ------------------------------------------------------------------ */

function Arc({
  arcId,
  anims,
  color,
}: {
  arcId: string;
  anims: AnimMap;
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
    const mat = materialRef.current;
    const pulse = pulseRef.current;
    if (!mat || !pulse || !curve) return;
    const entry = anims[arcId];
    if (!entry) {
      mat.opacity = 0;
      pulse.visible = false;
      return;
    }
    const since = performance.now() - entry.t;
    if (entry.dir === -1) {
      mat.opacity = Math.max(0, 0.57 * (1 - since / DESPAWN_MS));
      pulse.visible = false;
      return;
    }
    const draw = Math.min(since / ARC_DRAW_MS, 1);
    mat.opacity = 0.12 + draw * 0.45;
    // Live-infrastructure heartbeat: the pulse keeps traveling for as
    // long as the arc exists.
    pulse.visible = true;
    const t = (since / ARC_DRAW_MS) % 1;
    curve.getPoint(t, pulse.position);
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

/* ------------------------------------------------------------------ */
/* Camera choreography                                                 */
/* ------------------------------------------------------------------ */

const HOME_LOOK = new THREE.Vector3(-0.5, 0.6, -1.5);
const HOME_RADIUS = 11;
const FOCUS_RADIUS = 9;

/**
 * Slow orbital drift that leans toward whichever region/resource/arc the
 * apply script is currently provisioning, then settles back home.
 */
function CameraRig() {
  const { camera } = useThree();
  const focus = React.useRef({ point: HOME_LOOK.clone(), until: 0 });
  const look = React.useRef(HOME_LOOK.clone());
  const radius = React.useRef(HOME_RADIUS);

  React.useEffect(
    () =>
      subscribeApply((event: ApplyEvent) => {
        if (event.type === "complete" || event.type === "destroyed") {
          focus.current.until = 0;
          return;
        }
        const point = targetPosition(event.target);
        if (point) {
          focus.current.point.copy(point);
          focus.current.until = performance.now() + FOCUS_HOLD_MS;
        }
      }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const focused = performance.now() < focus.current.until;
    const desiredLook = focused ? focus.current.point : HOME_LOOK;
    const desiredRadius = focused ? FOCUS_RADIUS : HOME_RADIUS;

    look.current.lerp(desiredLook, 0.035);
    radius.current += (desiredRadius - radius.current) * 0.03;

    const angle = Math.sin(t * 0.08) * 0.35 + 0.45;
    camera.position.set(
      Math.sin(angle) * radius.current,
      6.2 + Math.sin(t * 0.11) * 0.9,
      Math.cos(angle) * radius.current
    );
    camera.lookAt(look.current);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Topology + Canvas                                                   */
/* ------------------------------------------------------------------ */

function Topology({ colors }: { colors: ThemeColors }) {
  // Presence (spawn/despawn/arc) and transient pulses (region pulse +
  // section focus) are tracked separately so a focus never re-runs a
  // spawn animation.
  const [anims, setAnims] = React.useState<AnimMap>({});
  const [pulses, setPulses] = React.useState<AnimMap>({});

  React.useEffect(
    () =>
      subscribeApply((event: ApplyEvent) => {
        if (event.type === "complete" || event.type === "destroyed") return;
        const entry: AnimEntry = { t: performance.now(), dir: 1 };
        if (event.type === "pulse" || event.type === "focus") {
          setPulses((prev) => ({ ...prev, [event.target]: entry }));
          return;
        }
        if (event.type === "despawn") entry.dir = -1;
        setAnims((prev) => ({ ...prev, [event.target]: entry }));
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
        <GlassPlatform
          key={region.id}
          regionId={region.id}
          label={region.label}
          pulses={pulses}
          color={i % 2 === 0 ? colors.brand : colors.brand2}
          labelColor={colors.label}
        />
      ))}
      {SCENE_RESOURCES.map((resource, i) => (
        <ResourceNode
          key={resource.id}
          resource={resource}
          anims={anims}
          pulses={pulses}
          color={i % 2 === 0 ? colors.brand : colors.brand2}
          altColor={i % 2 === 0 ? colors.brand2 : colors.brand}
        />
      ))}
      {SCENE_ARCS.map((arc) => (
        <Arc key={arc.id} arcId={arc.id} anims={anims} color={colors.brand} />
      ))}
      <Particles color={colors.brand2} />
    </group>
  );
}

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
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} />
      <pointLight position={[0, 4, 0]} intensity={6} distance={14} />
      <CameraRig />
      <Topology colors={colors} />
    </Canvas>
  );
}

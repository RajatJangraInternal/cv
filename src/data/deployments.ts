import { RESUME_DATA } from "@/data/resume-data";

/**
 * Scene config + terraform-apply script for the IaC Resume Engine hero.
 *
 * The apply script drives both the terminal output and the 3D scene:
 * each step's optional `event` is emitted on the apply event bus when its
 * line finishes typing. Arc endpoints are predefined here; an arc event's
 * `target` is the arc's id.
 *
 * Counts come straight from RESUME_DATA — the same object the /graphql
 * endpoint re-exports — so the terminal's "synced from /graphql" claim
 * holds without a build-time self-query (per the design doc).
 */

const CERT_COUNT = RESUME_DATA.certifications.length;

/** Whole years since the first role (Mar 2024) in resume-data. */
const CAREER_YEARS = Math.max(
  1,
  Math.floor(
    (Date.now() - new Date(2024, 2, 1).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  )
);

/** Real deploy hash when Vercel exposes system env vars; dev fallback. */
const DEPLOY_SHA =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local-dev";

export interface SceneRegion {
  id: string;
  label: string;
  /** Position on the ground grid (scene units, x right / z toward camera). */
  x: number;
  z: number;
}

export interface SceneResource {
  id: string;
  /** Region the resource spawns in. */
  region: string;
  /** Stylized form rendered by the Stage 2 scene. */
  kind: "tower" | "rack" | "conduit" | "cluster" | "badge" | "ring";
  /** Offset from the region anchor. */
  dx: number;
  dz: number;
  /** Height of the form (visual weight = importance). */
  h: number;
}

export interface SceneArc {
  id: string;
  from: string;
  to: string;
}

export interface ApplyEvent {
  type:
    | "spawn"
    | "arc"
    | "pulse"
    | "complete"
    | "despawn"
    | "destroyed"
    | "focus";
  target: string;
}

export interface ApplyStep {
  line: string;
  delayMs: number;
  event?: ApplyEvent;
}

export const SCENE_REGIONS: readonly SceneRegion[] = [
  { id: "region:central-india", label: "Central India", x: 0, z: 0 },
  { id: "region:east-us", label: "East US", x: -5.2, z: -2.2 },
  { id: "region:west-europe", label: "West Europe", x: -2.2, z: -4.4 },
  { id: "region:southeast-asia", label: "Southeast Asia", x: 4.6, z: -3.2 },
] as const;

export const SCENE_RESOURCES: readonly SceneResource[] = [
  {
    id: "res:career",
    region: "region:central-india",
    kind: "tower",
    dx: 0,
    dz: 0,
    h: 1.6,
  },
  {
    id: "res:labs",
    region: "region:east-us",
    kind: "rack",
    dx: 0.4,
    dz: 0.3,
    h: 1.2,
  },
  {
    id: "res:pipelines",
    region: "region:west-europe",
    kind: "conduit",
    dx: -0.3,
    dz: 0.4,
    h: 1.0,
  },
  {
    id: "res:hackathons",
    region: "region:southeast-asia",
    kind: "cluster",
    dx: 0.2,
    dz: -0.4,
    h: 0.9,
  },
  {
    id: "res:certs",
    region: "region:central-india",
    kind: "badge",
    dx: 1.3,
    dz: 0.8,
    h: 0.8,
  },
  {
    id: "res:automation",
    region: "region:east-us",
    kind: "ring",
    dx: -0.8,
    dz: -0.5,
    h: 0.7,
  },
] as const;

export const SCENE_ARCS: readonly SceneArc[] = [
  {
    id: "arc:central-india->east-us",
    from: "region:central-india",
    to: "region:east-us",
  },
  {
    id: "arc:central-india->west-europe",
    from: "region:central-india",
    to: "region:west-europe",
  },
  {
    id: "arc:central-india->southeast-asia",
    from: "region:central-india",
    to: "region:southeast-asia",
  },
] as const;

/**
 * The apply sequence. Numbers reference real resume facts:
 * 40K+ deployments, 100+ labs, 30+ hackathons, 7 certifications.
 */
export const APPLY_SCRIPT: readonly ApplyStep[] = [
  { line: "$ terraform apply -auto-approve", delayMs: 600 },
  { line: "Initializing provider plugins: azurerm, aws...", delayMs: 700 },
  { line: "state: synced from rajat.cloud/graphql", delayMs: 550 },
  { line: "Plan: 12 to add, 0 to change, 0 to destroy.", delayMs: 900 },
  {
    line: "azurerm_resource_group.career: Creating...",
    delayMs: 500,
    event: { type: "pulse", target: "region:central-india" },
  },
  {
    line: "azurerm_resource_group.career: Creation complete after 0.6s",
    delayMs: 600,
    event: { type: "spawn", target: "res:career" },
  },
  {
    line: "module.cloud_labs[100]: Creating...",
    delayMs: 500,
    event: { type: "pulse", target: "region:east-us" },
  },
  {
    line: "module.cloud_labs[100]: Creation complete after 1.2s",
    delayMs: 650,
    event: { type: "spawn", target: "res:labs" },
  },
  {
    line: "aws_codepipeline.deployments[40000]: Creating...",
    delayMs: 500,
    event: { type: "pulse", target: "region:west-europe" },
  },
  {
    line: "aws_codepipeline.deployments[40000]: Creation complete after 0.9s",
    delayMs: 650,
    event: { type: "spawn", target: "res:pipelines" },
  },
  {
    line: "peering: central-india <-> east-us: Established",
    delayMs: 550,
    event: { type: "arc", target: "arc:central-india->east-us" },
  },
  {
    line: "module.hackathons[30]: Creation complete after 0.8s",
    delayMs: 650,
    event: { type: "spawn", target: "res:hackathons" },
  },
  {
    line: "peering: central-india <-> west-europe: Established",
    delayMs: 550,
    event: { type: "arc", target: "arc:central-india->west-europe" },
  },
  {
    line: `microsoft_certification.expert[${CERT_COUNT}]: Creation complete after 0.4s`,
    delayMs: 650,
    event: { type: "spawn", target: "res:certs" },
  },
  {
    line: "peering: central-india <-> southeast-asia: Established",
    delayMs: 550,
    event: { type: "arc", target: "arc:central-india->southeast-asia" },
  },
  {
    line: "powershell_automation.graph_migration[60]: Creation complete after 1.1s",
    delayMs: 700,
    event: { type: "spawn", target: "res:automation" },
  },
  {
    line: `Apply complete! Resources: ${CERT_COUNT} certifications, 2 clouds, ${CAREER_YEARS} years added.`,
    delayMs: 400,
    event: { type: "complete", target: "scene" },
  },
  {
    line: `release: ${DEPLOY_SHA} · git push -> vercel · rajat.cloud`,
    delayMs: 600,
  },
] as const;

/**
 * Resume sections -> scene targets. Scrolling a section into view emits a
 * focus event: the camera leans toward the target and it pulses.
 */
export const SECTION_FOCUS: ReadonlyArray<{
  sectionId: string;
  target: string;
}> = [
  { sectionId: "about-section", target: "region:central-india" },
  { sectionId: "skills-section", target: "res:automation" },
  { sectionId: "work-experience", target: "res:career" },
  { sectionId: "certifications-section", target: "res:certs" },
  { sectionId: "side-projects", target: "res:pipelines" },
  { sectionId: "education-section", target: "res:labs" },
];

/**
 * The destroy easter egg (Cmd/Ctrl+J -> "terraform destroy"). Tears the
 * scene down resource by resource; the terminal auto-reapplies afterwards
 * so the hero never stays empty.
 */
export const DESTROY_SCRIPT: readonly ApplyStep[] = [
  { line: "$ terraform destroy -auto-approve", delayMs: 400 },
  { line: "Plan: 0 to add, 0 to change, 12 to destroy.", delayMs: 800 },
  {
    line: "powershell_automation.graph_migration[60]: Destroying...",
    delayMs: 450,
    event: { type: "despawn", target: "res:automation" },
  },
  {
    line: "peering: central-india <-> southeast-asia: Released",
    delayMs: 420,
    event: { type: "despawn", target: "arc:central-india->southeast-asia" },
  },
  {
    line: "microsoft_certification.expert[7]: Destroyed (revoke failed: permanent)",
    delayMs: 480,
    event: { type: "despawn", target: "res:certs" },
  },
  {
    line: "peering: central-india <-> west-europe: Released",
    delayMs: 420,
    event: { type: "despawn", target: "arc:central-india->west-europe" },
  },
  {
    line: "module.hackathons[30]: Destroyed",
    delayMs: 450,
    event: { type: "despawn", target: "res:hackathons" },
  },
  {
    line: "aws_codepipeline.deployments[40000]: Destroyed",
    delayMs: 450,
    event: { type: "despawn", target: "res:pipelines" },
  },
  {
    line: "peering: central-india <-> east-us: Released",
    delayMs: 420,
    event: { type: "despawn", target: "arc:central-india->east-us" },
  },
  {
    line: "module.cloud_labs[100]: Destroyed",
    delayMs: 450,
    event: { type: "despawn", target: "res:labs" },
  },
  {
    line: "azurerm_resource_group.career: Destroyed",
    delayMs: 500,
    event: { type: "despawn", target: "res:career" },
  },
  {
    line: "Destroy complete! Resources: 12 destroyed. Re-provisioning in 3s...",
    delayMs: 400,
    event: { type: "destroyed", target: "scene" },
  },
] as const;

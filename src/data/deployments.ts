/**
 * Scene config + terraform-apply script for the IaC Resume Engine hero.
 *
 * The apply script drives both the terminal output and the 3D scene:
 * each step's optional `event` is emitted on the apply event bus when its
 * line finishes typing. Arc endpoints are predefined here; an arc event's
 * `target` is the arc's id.
 *
 * All resource names map to real facts in resume-data.tsx.
 */

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
  /** Primitive used by the Stage 1 scene. */
  shape: "box" | "cylinder";
  /** Offset from the region anchor. */
  dx: number;
  dz: number;
  /** Height of the primitive (visual weight = importance). */
  h: number;
}

export interface SceneArc {
  id: string;
  from: string;
  to: string;
}

export interface ApplyEvent {
  type: "spawn" | "arc" | "pulse" | "complete";
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
    shape: "cylinder",
    dx: 0,
    dz: 0,
    h: 1.6,
  },
  {
    id: "res:labs",
    region: "region:east-us",
    shape: "box",
    dx: 0.4,
    dz: 0.3,
    h: 1.2,
  },
  {
    id: "res:pipelines",
    region: "region:west-europe",
    shape: "box",
    dx: -0.3,
    dz: 0.4,
    h: 1.0,
  },
  {
    id: "res:hackathons",
    region: "region:southeast-asia",
    shape: "box",
    dx: 0.2,
    dz: -0.4,
    h: 0.9,
  },
  {
    id: "res:certs",
    region: "region:central-india",
    shape: "cylinder",
    dx: 1.3,
    dz: 0.8,
    h: 0.8,
  },
  {
    id: "res:automation",
    region: "region:east-us",
    shape: "cylinder",
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
    line: "microsoft_certification.expert[7]: Creation complete after 0.4s",
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
    line: "Apply complete! Resources: 7 certifications, 2 clouds, 2 years added.",
    delayMs: 400,
    event: { type: "complete", target: "scene" },
  },
] as const;

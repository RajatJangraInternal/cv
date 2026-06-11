import type { ResumeData } from "@/lib/types";

export const RESUME_DATA: ResumeData = {
  name: "Rajat Kumar",
  initials: "RK",
  location: "New Delhi, India, IST",
  locationLink: "https://www.google.com/maps/place/New+Delhi,+India/",
  about:
    "Cloud Consultant automating and operating secure, scalable Azure & AWS platforms at enterprise scale.",
  summary: (
    <>
      Cloud Consultant with hands-on experience designing, automating, and
      operating cloud-native platforms across Microsoft Azure and AWS.
      Specialized in Infrastructure as Code, CI/CD automation, and large-scale
      cloud operations supporting thousands of users globally. Proven track
      record building secure, scalable lab environments, automating tenant
      onboarding, optimizing cloud costs, and resolving mission-critical
      production incidents.
    </>
  ),
  avatarUrl: "https://avatars.githubusercontent.com/u/162875200?v=4",
  personalWebsiteUrl: "https://rajat.cloud",
  contact: {
    email: "contact@rajat.cloud",
    tel: "+917419523719",
    social: [
      {
        name: "GitHub",
        url: "https://github.com/RajatJangra2653",
        icon: "github",
      },
      {
        name: "LinkedIn",
        url: "https://linkedin.com/in/rajat-cloud",
        icon: "linkedin",
      },
    ],
  },
  education: [
    {
      school: "Maharshi Dayanand University, Rohtak",
      degree: "B.Tech, Computer Science and Engineering - 80%",
      start: "2020",
      end: "2024",
    },
  ],
  work: [
    {
      company: "Spektra Systems",
      link: "https://spektrasystems.com/",
      badges: ["Remote", "Azure", "AWS", "PowerShell", "Microsoft Graph"],
      title: "Cloud Consultant",
      start: "Aug 2025",
      end: null,
      description: (
        <>
          L2/L3 support and automation for SLA-based production workloads across
          Azure and AWS.
          <ul className="list-inside list-disc">
            <li>
              Migrated 60+ PowerShell scripts from deprecated Az modules to
              Microsoft Graph, impacting 40,000+ production deployments
            </li>
            <li>
              Delivered live support for 100+ cloud labs across Azure AI Foundry,
              Azure DevOps, GitHub Actions, Semantic Kernel and API Management
              with 100% customer satisfaction
            </li>
            <li>
              Led a critical incident response, provisioning 2,500 licenses in
              production within an hour to resolve a platform outage and protect
              event delivery
            </li>
          </ul>
        </>
      ),
    },
    {
      company: "Spektra Systems",
      link: "https://spektrasystems.com/",
      badges: ["Remote", "Terraform", "Bicep", "ARM", "IAM / RBAC"],
      title: "Associate Cloud Consultant",
      start: "Jul 2024",
      end: "Jul 2025",
      description: (
        <>
          Designed and automated secure, highly-available Azure lab platforms
          using Infrastructure as Code.
          <ul className="list-inside list-disc">
            <li>
              Built HA / disaster-recovery-ready environments with ARM
              Templates, Terraform and Bicep
            </li>
            <li>
              Automated onboarding of thousands of cloud tenants via PowerShell,
              enabling centralized cost tracking and governance
            </li>
            <li>
              Produced cost models for 50+ lab environments and powered 30+
              global hackathons for 20+ enterprise clients
            </li>
          </ul>
        </>
      ),
    },
    {
      company: "Spektra Systems",
      link: "https://spektrasystems.com/",
      badges: ["Remote", "Azure", "AWS", "Networking", "IAM"],
      title: "Cloud Consultant Trainee",
      start: "Mar 2024",
      end: "Jun 2024",
      description: (
        <>
          Deployed, administered and troubleshot cloud infrastructure across
          Azure and AWS - virtual machines, networking, IAM and load balancers -
          while building automation and deployment documentation.
        </>
      ),
    },
  ],
  skills: [
    "Azure",
    "AWS",
    "Microsoft 365",
    "Terraform",
    "Bicep",
    "ARM Templates",
    "Docker",
    "Kubernetes",
    "GitHub Actions",
    "Azure DevOps",
    "CI/CD",
    "PowerShell",
    "Python",
    "Bash",
    "Linux",
    "IAM & RBAC",
    "Azure Monitor",
    "Networking",
  ],
  projects: [
    {
      title: "Cloud-Native Resume (AWS DevOps Pipeline)",
      techStack: [
        "Terraform",
        "AWS ECS",
        "Docker",
        "GitHub Actions",
        "Route 53",
        "S3",
      ],
      description:
        "End-to-end AWS DevOps pipeline: Terraform-provisioned infrastructure with remote S3 state, a GitHub Actions CI/CD flow building Dockerized images onto Amazon ECS behind an Application Load Balancer, with Route 53 DNS - fully automated from commit to live deploy.",
      link: {
        label: "rajat.cloud",
        href: "https://rajat.cloud",
      },
    },
    {
      title: "Task Manager (Azure AKS Platform)",
      techStack: ["Azure AKS", "Kubernetes", "Terraform", "Docker", "azd"],
      description:
        "Cloud-native Kubernetes platform on Azure AKS, provisioned with Terraform. Containerized micro-services with service discovery, Horizontal Pod Autoscaling, Kubernetes Secrets, ingress routing and zero-touch rollout via the Azure Developer CLI.",
    },
  ],
} as const;

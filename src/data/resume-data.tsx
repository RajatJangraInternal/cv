import type { ResumeData } from "@/lib/types";

export const RESUME_DATA: ResumeData = {
  name: "Rajat Kumar",
  initials: "RJ",
  location: "Bahadurgarh, India, IST",
  locationLink: "https://www.google.com/maps/place/Bahadurgarh,+India/",
  about: "Cloud Consultant dedicated to delivering high-quality services.",
  summary: (
    <>
      Cloud Consultant with hands-on experience designing, automating, and operating cloud-native platforms across Microsoft Azure and AWS. Specialized in Infrastructure as Code, CI/CD automation, and large-scale cloud operations supporting thousands of users globally. Proven track record in building secure, scalable lab environments, automating tenant onboarding, optimizing cloud costs, and resolving mission-critical production incidents. Passionate about delivering reliable, high-performance cloud solutions through strong engineering, automation, and operational excellence.
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
      // {
      //   name: "X",
      //   url: "https://x.com/BartoszJarocki",
      //   icon: "x",
      // },
    ],
  },
  education: [
    {
      school: "MDU",
      degree: "Bachelor's Degree in Computer Science Engineering",
      start: "2020",
      end: "2024",
    },
    //,
    // {
    //   school: "S.R. Century School, Bahadurgarh",
    //   degree: "Senior Secondary (12th)",
    //   start: "2019",
    //   end: "2020",
    // },
  ],
  work: [
    {
      company: "Spektra Systems",
      link: "https://spektrasystems.com/",
      badges: ["Remote", "Azure", "M365", "DevOps", "IaC"],
      title: "Cloud Consultant",
      start: "2024",
      end: null,
      description: (
        <>
          Working on secure, scalable Azure and Microsoft 365 cloud solutions,
          enabling organizations to govern, automate, and optimize cloud
          environments while accelerating enterprise cloud adoption and DevOps
          practices.
        </>
      ),
    },
    // {
    //   company: "Film.io",
    //   link: "https://film.io",
    //   badges: ["Remote", "React", "Next.js", "TypeScript", "Node.js"],
    //   title: "Software Architect",
    //   start: "2024",
    //   end: "2025",
    //   description: (
    //     <>
    //       Leading technical architecture of a blockchain-based film funding
    //       platform.
    //       <ul className="list-inside list-disc">
    //         <li>
    //           Architecting migration from CRA to Next.js for improved
    //           performance, SEO, and DX
    //         </li>
    //         <li>
    //           Established release process enabling faster deployments and
    //           reliable rollbacks
    //         </li>
    //         <li>
    //           Implementing system-wide monitoring and security improvements
    //         </li>
    //       </ul>
    //     </>
    //   ),
    // },
    // {
    //   company: "Parabol",
    //   link: "https://parabol.co",
    //   badges: [
    //     "Remote",
    //     "React",
    //     "TypeScript",
    //     "Node.js",
    //     "GraphQL",
    //     "Tailwind CSS",
    //   ],
    //   title: "Senior Full Stack Developer",
    //   start: "2021",
    //   end: "2024",
    //   description: (
    //     <>
    //       Senior developer and squad leader for an enterprise agile meeting
    //       platform.
    //       <ul className="list-inside list-disc">
    //         <li>
    //           Built design system with Tailwind CSS, improving development speed
    //           and time to market
    //         </li>
    //         <li>
    //           Implemented engineering practices: PR automation, code review
    //           guidelines, and workflows
    //         </li>
    //         <li>
    //           Open source contributions to Relay DevTools and React i18n tooling
    //         </li>
    //       </ul>
    //     </>
    //   ),
    // },
    // {
    //   company: "Clevertech",
    //   link: "https://clevertech.biz",
    //   badges: ["Remote", "React", "TypeScript", "Node.js", "Android", "Kotlin"],
    //   title: "Lead Android Developer → Full Stack Developer",
    //   start: "2015",
    //   end: "2021",
    //   description: (
    //     <>
    //       Successfully transitioned from mobile to full-stack development while
    //       leading distributed teams.
    //       <ul className="list-inside list-disc">
    //         <li>
    //           Led frontend team at Evercast, building real-time platform
    //           supporting 30+ users per room with HD streaming and collaboration
    //           tools
    //         </li>
    //         <li>
    //           Developed offline-first Android app for DKMS, improving donor
    //           registration process
    //         </li>
    //         <li>
    //           Led development teams across multiple successful client projects
    //         </li>
    //       </ul>
    //     </>
    //   ),
    // },
    // {
    //   company: "Jojo Mobile",
    //   link: "https://bsgroup.eu/",
    //   badges: ["On Site", "Android", "Java", "Kotlin"],
    //   title: "Android Developer → Lead Android Developer",
    //   start: "2012",
    //   end: "2015",
    //   description: (
    //     <>
    //       First Android developer, grew and led a team of 15+ engineers while
    //       establishing engineering culture.
    //       <ul className="list-inside list-disc">
    //         <li>
    //           Developed apps for major Polish companies including LOT, Polskie
    //           Radio, and Agora
    //         </li>
    //         <li>Built and mentored high-performing mobile development team</li>
    //       </ul>
    //     </>
    //   ),
    // },
    // {
    //   company: "Nokia Siemens Networks",
    //   link: "https://www.nokia.com",
    //   badges: ["On Site", "C/C++", "LTE", "Agile"],
    //   title: "C/C++ Developer",
    //   start: "2010",
    //   end: "2012",
    //   description:
    //     "Developed software for LTE base stations at enterprise scale, gaining strong fundamentals in software architecture, testing practices, and cross-team collaboration.",
    // },
  ],
  skills: [
    "Azure",
    "Python",
    "Powershell",
    "Bash",
    "Docker",
    "Terraform",
    "Bicep",
    "Git",
    "Github Actions",
    "CI/CD",
    "DevOps",
    "Linux",
    "Kubernetes",
  ],
  projects: [
    // {
    //   title: "Monito",
    //   techStack: ["TypeScript", "Next.js", "Browser Extension", "PostgreSQL"],
    //   description:
    //     "Browser extension for debugging web applications. Includes taking screenshots, screen recording, E2E tests generation and generating bug reports",
    //   link: {
    //     label: "monito.dev",
    //     href: "https://monito.dev/",
    //   },
    // },
    // {
    //   title: "Consultly",
    //   techStack: [
    //     "TypeScript",
    //     "Next.js",
    //     "Vite",
    //     "GraphQL",
    //     "WebRTC",
    //     "Tailwind CSS",
    //     "PostgreSQL",
    //     "Redis",
    //   ],
    //   description:
    //     "Platform for online consultations with real-time video meetings and scheduling",
    //   link: {
    //     label: "consultly.com",
    //     href: "https://consultly.com/",
    //   },
    // },
    // {
    //   title: "Minimalist CV",
    //   techStack: ["TypeScript", "Next.js", "Tailwind CSS"],
    //   description:
    //     "An open source minimalist, print friendly CV template with a focus on readability and clean design. >9k stars on GitHub",
    //   link: {
    //     label: "Minimalist CV",
    //     href: "https://github.com/BartoszJarocki/cv",
    //   },
    // },
  ],
} as const;

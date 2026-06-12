import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { SKILL_GROUPS } from "@/data/resume-data";
import { cn } from "@/lib/utils";

type Skills = readonly string[];

interface SkillsListProps {
  skills: Skills;
  className?: string;
}

/**
 * Renders a list of skills as badges
 */
function SkillsList({ skills, className }: SkillsListProps) {
  return (
    <ul
      className={cn("flex list-none flex-wrap gap-1 p-0", className)}
      aria-label="List of skills"
    >
      {skills.map((skill) => (
        <li key={skill}>
          <Badge
            variant="secondary"
            className="border border-border bg-secondary/60 text-secondary-foreground transition-colors hover:border-brand hover:text-brand print:border-foreground/20 print:text-[10px]"
            aria-label={`Skill: ${skill}`}
          >
            {skill}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

interface SkillsProps {
  skills: Skills;
  className?: string;
}

/**
 * Skills section component
 * Displays professional skills as badges grouped under category kickers.
 */
export function Skills({ skills, className }: SkillsProps) {
  const grouped = new Set(SKILL_GROUPS.flatMap((group) => group.skills));
  const ungrouped = skills.filter((skill) => !grouped.has(skill));

  const groups = [
    ...SKILL_GROUPS.map((group) => ({
      ...group,
      skills: group.skills.filter((skill) => skills.includes(skill)),
    })).filter((group) => group.skills.length > 0),
    ...(ungrouped.length > 0 ? [{ label: "more", skills: ungrouped }] : []),
  ];

  return (
    <Section className={className}>
      <h2 className="text-xl font-bold" id="skills-section">
        Skills
      </h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 print:grid-cols-2 print:gap-1">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <p className="font-mono text-[11px] tracking-wider text-brand/80 print:text-[9px] print:text-foreground">
              {"// "}
              {group.label}
            </p>
            <SkillsList skills={group.skills} />
          </div>
        ))}
      </div>
    </Section>
  );
}

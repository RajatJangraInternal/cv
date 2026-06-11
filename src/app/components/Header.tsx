import { GlobeIcon, MailIcon, PhoneIcon } from "lucide-react";
import React from "react";
import { Avatar } from "@/components/avatar";
import { HeaderActions } from "@/components/header-actions";
import { Button } from "@/components/ui/button";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { XIcon } from "@/components/icons/x-icon";
import { RESUME_DATA } from "@/data/resume-data";
import type { IconType } from "@/lib/types";

// Type-safe icon mapping
const ICON_MAP: Record<
  IconType,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  x: XIcon,
  globe: GlobeIcon,
  mail: MailIcon,
  phone: PhoneIcon,
} as const;

interface LocationLinkProps {
  location: typeof RESUME_DATA.location;
  locationLink: typeof RESUME_DATA.locationLink;
}

function LocationLink({ location, locationLink }: LocationLinkProps) {
  return (
    <p className="max-w-md items-center text-pretty font-mono text-xs text-muted-foreground">
      <a
        className="inline-flex gap-x-1.5 align-baseline leading-none hover:text-brand hover:underline"
        href={locationLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Location: ${location}`}
      >
        <GlobeIcon className="size-3" aria-hidden="true" />
        {location}
      </a>
    </p>
  );
}

interface SocialButtonProps {
  href: string;
  iconType: IconType;
  label: string;
}

function SocialButton({ href, iconType, label }: SocialButtonProps) {
  const IconComponent = ICON_MAP[iconType];

  return (
    <Button
      className="size-8 hover:border-brand hover:text-brand"
      variant="outline"
      size="icon"
      asChild={true}
    >
      <a href={href} aria-label={label} target="_blank" rel="noopener noreferrer">
        <IconComponent className="size-4" aria-hidden="true" />
      </a>
    </Button>
  );
}

interface ContactButtonsProps {
  contact: typeof RESUME_DATA.contact;
  personalWebsiteUrl?: string;
}

function ContactButtons({ contact, personalWebsiteUrl }: ContactButtonsProps) {
  return (
    <ul
      className="flex list-none flex-wrap gap-x-1 gap-y-1 pt-1 font-mono text-sm text-foreground/80 print:hidden"
      aria-label="Contact links"
    >
      {personalWebsiteUrl && (
        <li>
          <SocialButton
            href={personalWebsiteUrl}
            iconType="globe"
            label="Personal website"
          />
        </li>
      )}
      {contact.email && (
        <li>
          <SocialButton
            href={`mailto:${contact.email}`}
            iconType="mail"
            label="Email"
          />
        </li>
      )}
      {contact.tel && (
        <li>
          <SocialButton
            href={`tel:${contact.tel}`}
            iconType="phone"
            label="Phone"
          />
        </li>
      )}
      {contact.social.map((social) => (
        <li key={social.name}>
          <SocialButton
            href={social.url}
            iconType={social.icon}
            label={social.name}
          />
        </li>
      ))}
    </ul>
  );
}

interface PrintContactProps {
  contact: typeof RESUME_DATA.contact;
  personalWebsiteUrl?: string;
}

function PrintContact({ contact, personalWebsiteUrl }: PrintContactProps) {
  return (
    <div className="hidden gap-x-2 font-mono text-sm text-foreground/80 print:flex print:text-[12px]">
      {personalWebsiteUrl && (
        <>
          <a
            className="underline hover:text-foreground/70"
            href={personalWebsiteUrl}
          >
            {new URL(personalWebsiteUrl).hostname}
          </a>
          <span aria-hidden="true">/</span>
        </>
      )}
      {contact.email && (
        <>
          <a
            className="underline hover:text-foreground/70"
            href={`mailto:${contact.email}`}
          >
            {contact.email}
          </a>
          <span aria-hidden="true">/</span>
        </>
      )}
      {contact.tel && (
        <a
          className="underline hover:text-foreground/70"
          href={`tel:${contact.tel}`}
        >
          {contact.tel}
        </a>
      )}
    </div>
  );
}

/**
 * Header / hero — personal info, role, contact and screen actions.
 */
export function Header() {
  return (
    <header className="relative flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-x-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-brand print:hidden">
            <span
              className="size-1.5 animate-pulse rounded-full bg-brand"
              aria-hidden="true"
            />
            Open to opportunities
          </span>
        </div>

        <h1
          className="text-gradient text-3xl font-bold tracking-tight sm:text-4xl"
          id="resume-name"
        >
          {RESUME_DATA.name}
        </h1>

        <p className="max-w-md text-pretty font-mono text-sm font-medium text-foreground/90 print:text-[12px]">
          {RESUME_DATA.about}
        </p>

        <LocationLink
          location={RESUME_DATA.location}
          locationLink={RESUME_DATA.locationLink}
        />

        <ContactButtons
          contact={RESUME_DATA.contact}
          personalWebsiteUrl={RESUME_DATA.personalWebsiteUrl}
        />

        <PrintContact
          contact={RESUME_DATA.contact}
          personalWebsiteUrl={RESUME_DATA.personalWebsiteUrl}
        />
      </div>

      <div className="flex flex-col items-end gap-3">
        <HeaderActions />
        <Avatar
          className="size-28"
          src={RESUME_DATA.avatarUrl}
          alt={`${RESUME_DATA.name}'s profile picture`}
          fallback={RESUME_DATA.initials}
        />
      </div>
    </header>
  );
}
"use client";

import {
  getCorporateTitleTag,
  getProfileImageUrl,
  resolveAccountType,
} from "@/lib/profile-identity";
import type { Profile } from "@/types/database";

interface ProfessionalIdentityBadgeProps {
  profile: Profile;
}

export function ProfessionalIdentityBadge({
  profile,
}: ProfessionalIdentityBadgeProps) {
  const accountType = resolveAccountType(profile);
  const imageUrl = getProfileImageUrl(profile);
  const titleTag = getCorporateTitleTag(accountType);
  const displayName =
    profile.full_name?.trim() ||
    profile.company_name?.trim() ||
    profile.email;

  return (
    <div className="hidden items-center gap-3 rounded-full border border-cream/15 bg-charcoal/80 px-3 py-1.5 sm:flex">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cream/15 bg-charcoal">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-cream">{displayName}</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          {titleTag}
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { buildSubscriptionStatusSnapshot } from "@/lib/supabase/profile-quota";
import type { Profile } from "@/types/database";

interface SubscriptionStatusBadgeProps {
  profile: Profile | null;
  loading?: boolean;
}

function SubscriptionStatusBadgeSkeleton() {
  return (
    <div
      className="hidden h-9 min-w-[188px] animate-pulse rounded-full border border-primary/20 bg-charcoal px-4 sm:block"
      aria-hidden="true"
    >
      <div className="flex h-full items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary/30" />
        <div className="h-2.5 flex-1 rounded bg-cream/10" />
      </div>
    </div>
  );
}

export function SubscriptionStatusBadge({
  profile,
  loading = false,
}: SubscriptionStatusBadgeProps) {
  const status = useMemo(
    () => (profile ? buildSubscriptionStatusSnapshot(profile) : null),
    [profile]
  );

  if (loading || !status) {
    return <SubscriptionStatusBadgeSkeleton />;
  }

  const isUrgentTrial =
    status.isTrial &&
    status.trialDaysRemaining !== null &&
    status.trialDaysRemaining <= 3;

  return (
    <Link
      href="/panel/uyelik"
      className={`group hidden items-center rounded-full border bg-charcoal px-3.5 py-1.5 transition-all duration-200 sm:inline-flex ${
        status.isTrial
          ? isUrgentTrial || status.isTrialExpired
            ? "border-primary/70 shadow-md shadow-primary/15 hover:border-primary"
            : "border-primary/35 hover:border-primary/55"
          : "border-primary/25 hover:border-primary/45"
      }`}
      title={status.badgeLabel}
    >
      <span
        className={`mr-2 h-1.5 w-1.5 shrink-0 rounded-full ${
          status.isTrial
            ? status.isTrialExpired
              ? "bg-primary animate-pulse"
              : "bg-primary"
            : "bg-cream/45 group-hover:bg-primary/80"
        }`}
      />
      <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/85">
        {status.badgeLabel}
      </span>
    </Link>
  );
}

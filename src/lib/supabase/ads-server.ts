import { createClient } from "@/lib/supabase/server";
import {
  buildOwnershipScopeFilter,
  resolveOwnershipContext,
} from "@/lib/supabase/ownership";
import type { ClassifiedAd, ClassifiedAdWithVendor, Profile } from "@/types/database";

const AGENT_PROFILE_SELECT = "full_name, email, company_name";

const AD_SELECT = `
  *,
  vendor:profiles!vendor_id (
    ${AGENT_PROFILE_SELECT}
  ),
  broker:profiles!managed_by_id (
    ${AGENT_PROFILE_SELECT}
  ),
  owner:profiles!owner_id (
    ${AGENT_PROFILE_SELECT}
  )
`;

function normalizeAdRow(row: Record<string, unknown>): ClassifiedAdWithVendor {
  return {
    ...(row as unknown as ClassifiedAdWithVendor),
    is_luxury_listing: Boolean(row.is_luxury_listing ?? false),
    listing_tier:
      (row.listing_tier as ClassifiedAdWithVendor["listing_tier"]) ?? "standard",
    property_segment: (row.property_segment as string | null) ?? null,
    premium_highlight: (row.premium_highlight as string | null) ?? null,
    virtual_tour_url: (row.virtual_tour_url as string | null) ?? null,
    vendor: (row.vendor as ClassifiedAdWithVendor["vendor"]) ?? null,
    broker: (row.broker as ClassifiedAdWithVendor["broker"]) ?? null,
    owner: (row.owner as ClassifiedAdWithVendor["owner"]) ?? null,
  };
}

export async function fetchAdById(
  id: string
): Promise<ClassifiedAdWithVendor | null> {
  const supabase = await createClient();

  const { data: approved, error: approvedError } = await supabase
    .from("classified_ads")
    .select(AD_SELECT)
    .eq("id", id)
    .eq("status", "approved")
    .eq("is_archived", false)
    .eq("visibility_mode", "public")
    .single();

  if (!approvedError && approved) {
    return normalizeAdRow(approved as Record<string, unknown>);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return null;
  }

  const { data: adminAd, error: adminError } = await supabase
    .from("classified_ads")
    .select(AD_SELECT)
    .eq("id", id)
    .single();

  if (adminError || !adminAd) {
    return null;
  }

  return normalizeAdRow(adminAd as Record<string, unknown>);
}

/** @deprecated Use fetchAdById */
export async function fetchPublicAdById(
  id: string
): Promise<ClassifiedAdWithVendor | null> {
  return fetchAdById(id);
}

export async function fetchOwnedAdForEdit(
  id: string,
  userId: string,
  profile: Pick<Profile, "organization_role" | "parent_office_id"> | null
): Promise<ClassifiedAd | null> {
  const supabase = await createClient();
  const { ownerId } = resolveOwnershipContext(profile, userId);

  const { data, error } = await supabase
    .from("classified_ads")
    .select("*")
    .eq("id", id)
    .or(buildOwnershipScopeFilter(ownerId, userId))
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ClassifiedAd;
}

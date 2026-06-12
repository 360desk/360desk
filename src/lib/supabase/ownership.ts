import type { OrganizationRole, Profile } from "@/types/database";

export interface OwnershipContext {
  ownerId: string;
  managedById: string;
  billingUserId: string;
  organizationRole: OrganizationRole;
}

export interface ListingOwnershipRow {
  id: string;
  vendor_id: string;
  owner_id?: string | null;
  managed_by_id?: string | null;
}

const DEFAULT_ORGANIZATION_ROLE: OrganizationRole = "individual";

export function resolveOwnershipContext(
  profile: Pick<
    Profile,
    "organization_role" | "parent_office_id"
  > | null,
  userId: string
): OwnershipContext {
  const organizationRole =
    profile?.organization_role ?? DEFAULT_ORGANIZATION_ROLE;

  const isOfficeStaff =
    organizationRole === "office_staff" && Boolean(profile?.parent_office_id);

  const ownerId = isOfficeStaff
    ? (profile?.parent_office_id as string)
    : userId;

  return {
    ownerId,
    managedById: userId,
    billingUserId: isOfficeStaff
      ? (profile?.parent_office_id as string)
      : userId,
    organizationRole,
  };
}

function uniqueScopeIds(ownerId: string, userId: string): string[] {
  return ownerId === userId ? [userId] : [userId, ownerId];
}

export function buildMultiIdOwnershipScopeFilter(scopeIds: string[]): string {
  const clauses: string[] = [];

  for (const id of [...new Set(scopeIds.filter(Boolean))]) {
    clauses.push(`vendor_id.eq.${id}`);
    clauses.push(`owner_id.eq.${id}`);
    clauses.push(`managed_by_id.eq.${id}`);
  }

  return [...new Set(clauses)].join(",");
}

/**
 * PostgREST OR filter for reads. `vendor_id` is the legacy canonical creator
 * column; `owner_id` / `managed_by_id` cover office and transfer ownership.
 */
export function buildOwnershipScopeFilter(ownerId: string, userId: string) {
  return buildMultiIdOwnershipScopeFilter(uniqueScopeIds(ownerId, userId));
}

export function listingMatchesEditScope(
  listing: ListingOwnershipRow,
  userId: string,
  ownerId: string
): boolean {
  const allowedIds = new Set(uniqueScopeIds(ownerId, userId));

  if (allowedIds.has(listing.vendor_id)) {
    return true;
  }

  if (listing.owner_id && allowedIds.has(listing.owner_id)) {
    return true;
  }

  if (listing.managed_by_id && allowedIds.has(listing.managed_by_id)) {
    return true;
  }

  return false;
}

export function logListingUpdateDenied(
  reason: string,
  context: {
    userId: string;
    listingId: string;
    ownerId?: string;
    listing?: ListingOwnershipRow | null;
    details?: unknown;
  }
) {
  console.log("[listing-update] denied", {
    reason,
    authenticatedUserId: context.userId,
    listingId: context.listingId,
    resolvedOwnerId: context.ownerId,
    listingVendorId: context.listing?.vendor_id ?? null,
    listingOwnerId: context.listing?.owner_id ?? null,
    listingManagedById: context.listing?.managed_by_id ?? null,
    details: context.details ?? null,
  });
}

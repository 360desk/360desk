import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/auth-server";
import { profileHasTeamAccess } from "@/lib/supabase/team-quota";
import { isOfficeAdmin } from "@/lib/team-auth";
import type {
  ListingTransferRequest,
  ListingTransferResult,
  ListingTransferType,
} from "@/types/listing-transfer";
import type { AccountOrigin, Profile } from "@/types/database";

interface ListingOwnershipRow {
  id: string;
  owner_id: string | null;
  managed_by_id: string | null;
  vendor_id: string;
  transfer_status: string | null;
  target_owner_id: string | null;
  is_archived: boolean;
  status: string;
}

async function resolveTransferClient(): Promise<SupabaseClient> {
  try {
    return createAdminClient();
  } catch {
    return createClient();
  }
}

function isActiveListing(row: ListingOwnershipRow): boolean {
  return !row.is_archived && row.status !== "rejected";
}

async function fetchListingsByIds(
  supabase: SupabaseClient,
  listingIds: string[]
): Promise<ListingOwnershipRow[]> {
  if (listingIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("classified_ads")
    .select(
      "id, owner_id, managed_by_id, vendor_id, transfer_status, target_owner_id, is_archived, status"
    )
    .in("id", listingIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ListingOwnershipRow[];
}

function userControlsListing(
  listing: ListingOwnershipRow,
  userId: string
): boolean {
  return (
    listing.vendor_id === userId ||
    listing.owner_id === userId ||
    listing.managed_by_id === userId
  );
}

async function fetchStaffProfile(
  supabase: SupabaseClient,
  staffId: string
): Promise<{
  id: string;
  parent_office_id: string | null;
  account_origin: AccountOrigin;
  user_type: string | null;
} | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, parent_office_id, account_origin, user_type")
    .eq("id", staffId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as {
    id: string;
    parent_office_id: string | null;
    account_origin: AccountOrigin;
    user_type: string | null;
  } | null;
}

async function validateTransferTarget(
  supabase: SupabaseClient,
  targetOwnerId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", targetOwnerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.role === "admin") {
    throw new Error("Geçersiz devralma hedefi.");
  }
}

async function validateOfficeTransferTarget(
  supabase: SupabaseClient,
  brokerId: string,
  staffId: string,
  targetOwnerId: string
): Promise<void> {
  if (targetOwnerId === brokerId) {
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", targetOwnerId)
    .eq("parent_office_id", brokerId)
    .eq("user_type", "office_staff")
    .neq("id", staffId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Geçersiz ilan devralma hedefi seçildi.");
  }
}

function isExternalInviteStaff(accountOrigin: AccountOrigin): boolean {
  return accountOrigin === "self";
}

export async function executeVoluntaryTransfer(
  supabase: SupabaseClient,
  requesterId: string,
  listingIds: string[],
  targetOwnerId: string
): Promise<ListingTransferResult> {
  if (requesterId === targetOwnerId) {
    throw new Error("İlanları kendi hesabınıza devredemezsiniz.");
  }

  await validateTransferTarget(supabase, targetOwnerId);

  const listings = await fetchListingsByIds(supabase, listingIds);
  const transferable = listings.filter(
    (listing) =>
      isActiveListing(listing) &&
      userControlsListing(listing, requesterId) &&
      listing.transfer_status !== "pending"
  );

  if (transferable.length === 0) {
    throw new Error("Devredilebilir ilan bulunamadı.");
  }

  const ids = transferable.map((listing) => listing.id);

  const { error } = await supabase
    .from("classified_ads")
    .update({
      transfer_status: "pending",
      target_owner_id: targetOwnerId,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return {
    transfer_type: "voluntary",
    transferred_count: ids.length,
    listing_ids: ids,
    target_owner_id: targetOwnerId,
    message:
      "Devir talebi oluşturuldu. Alıcının panelinden onaylanması gerekiyor.",
  };
}

export async function executeTransferApproval(
  supabase: SupabaseClient,
  recipientId: string,
  listingIds: string[],
  nextStatus: "approved" | "rejected"
): Promise<ListingTransferResult> {
  const listings = await fetchListingsByIds(supabase, listingIds);
  const pending = listings.filter(
    (listing) =>
      listing.transfer_status === "pending" &&
      listing.target_owner_id === recipientId
  );

  if (pending.length === 0) {
    throw new Error("Onay bekleyen devir talebi bulunamadı.");
  }

  const ids = pending.map((listing) => listing.id);

  if (nextStatus === "rejected") {
    const { error } = await supabase
      .from("classified_ads")
      .update({
        transfer_status: "rejected",
        target_owner_id: null,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (error) {
      throw new Error(error.message);
    }

    return {
      transfer_type: "reject",
      transferred_count: ids.length,
      listing_ids: ids,
      message: "Devir talebi reddedildi.",
    };
  }

  const { error } = await supabase
    .from("classified_ads")
    .update({
      owner_id: recipientId,
      managed_by_id: recipientId,
      vendor_id: recipientId,
      transfer_status: "approved",
      target_owner_id: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return {
    transfer_type: "approve",
    transferred_count: ids.length,
    listing_ids: ids,
    target_owner_id: recipientId,
    message: "Devir talebi onaylandı ve sahiplik güncellendi.",
  };
}

export async function executeOfficePortfolioReassign(
  supabase: SupabaseClient,
  brokerId: string,
  staffId: string,
  targetOwnerId: string
): Promise<ListingTransferResult> {
  const staff = await fetchStaffProfile(supabase, staffId);

  if (
    !staff ||
    (staff.parent_office_id !== brokerId &&
      !(await staffBelongsToBroker(supabase, staffId, brokerId)))
  ) {
    throw new Error("Danışman bulunamadı veya ofise bağlı değil.");
  }

  await validateOfficeTransferTarget(
    supabase,
    brokerId,
    staffId,
    targetOwnerId
  );

  const { data: listings, error: listingsError } = await supabase
    .from("classified_ads")
    .select(
      "id, owner_id, managed_by_id, vendor_id, transfer_status, target_owner_id, is_archived, status"
    )
    .eq("managed_by_id", staffId)
    .eq("is_archived", false)
    .neq("status", "rejected");

  if (listingsError) {
    throw new Error(listingsError.message);
  }

  const rows = (listings ?? []) as ListingOwnershipRow[];
  const ids = rows.map((listing) => listing.id);

  if (ids.length === 0) {
    return {
      transfer_type: "office_reassign",
      transferred_count: 0,
      listing_ids: [],
      target_owner_id: targetOwnerId,
      staff_id: staffId,
      message: "Devredilecek aktif ilan bulunamadı.",
    };
  }

  const { error } = await supabase
    .from("classified_ads")
    .update({
      owner_id: targetOwnerId,
      managed_by_id: targetOwnerId,
      vendor_id: targetOwnerId,
      transfer_status: "approved",
      target_owner_id: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return {
    transfer_type: "office_reassign",
    transferred_count: ids.length,
    listing_ids: ids,
    target_owner_id: targetOwnerId,
    staff_id: staffId,
    message: "Portföyler başarıyla devredildi.",
  };
}

async function staffBelongsToBroker(
  supabase: SupabaseClient,
  staffId: string,
  brokerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("company_leader_id")
    .eq("id", staffId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.company_leader_id === brokerId;
}

export async function executeOfficeForcedTransfer(
  supabase: SupabaseClient,
  brokerId: string,
  staffId: string,
  targetOwnerId: string
): Promise<ListingTransferResult> {
  const staff = await fetchStaffProfile(supabase, staffId);

  if (!staff || staff.parent_office_id !== brokerId) {
    throw new Error("Danışman bulunamadı veya ofise bağlı değil.");
  }

  if (isExternalInviteStaff(staff.account_origin)) {
    throw new Error(
      "Dışarıdan davet ile gelen bağımsız kullanıcıların ilanları ofis kapatma sırasında zorla devredilemez."
    );
  }

  await validateOfficeTransferTarget(
    supabase,
    brokerId,
    staffId,
    targetOwnerId
  );

  const { data: listings, error: listingsError } = await supabase
    .from("classified_ads")
    .select(
      "id, owner_id, managed_by_id, vendor_id, transfer_status, target_owner_id, is_archived, status"
    )
    .eq("managed_by_id", staffId)
    .eq("is_archived", false)
    .neq("status", "rejected");

  if (listingsError) {
    throw new Error(listingsError.message);
  }

  const rows = (listings ?? []) as ListingOwnershipRow[];
  const ids = rows.map((listing) => listing.id);

  if (ids.length === 0) {
    return {
      transfer_type: "office_forced",
      transferred_count: 0,
      listing_ids: [],
      target_owner_id: targetOwnerId,
      staff_id: staffId,
      message: "Devredilecek aktif ilan bulunamadı.",
    };
  }

  const { error } = await supabase
    .from("classified_ads")
    .update({
      owner_id: targetOwnerId,
      managed_by_id: targetOwnerId,
      vendor_id: targetOwnerId,
      transfer_status: "approved",
      target_owner_id: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  const profilePayload = {
    user_type: "individual",
    parent_office_id: null,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ ...profilePayload, is_suspended: true })
    .eq("id", staffId);

  if (profileError?.message.includes("does not exist")) {
    const { error: fallbackProfileError } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("id", staffId);

    if (fallbackProfileError) {
      throw new Error(fallbackProfileError.message);
    }
  } else if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    transfer_type: "office_forced",
    transferred_count: ids.length,
    listing_ids: ids,
    target_owner_id: targetOwnerId,
    staff_id: staffId,
    message: "Ofis zorunlu devir işlemi tamamlandı.",
  };
}

export async function processListingTransfer(
  request: ListingTransferRequest,
  actor: { userId: string; profile: Profile | null }
): Promise<ListingTransferResult> {
  const supabase = await resolveTransferClient();
  const listingIds = (request.listing_ids ?? [])
    .map((id) => id.trim())
    .filter(Boolean);

  switch (request.transfer_type as ListingTransferType) {
    case "voluntary": {
      const targetOwnerId = request.target_owner_id?.trim();

      if (!targetOwnerId || listingIds.length === 0) {
        throw new Error("İlan ve devralma hedefi zorunludur.");
      }

      return executeVoluntaryTransfer(
        supabase,
        actor.userId,
        listingIds,
        targetOwnerId
      );
    }

    case "approve":
      return executeTransferApproval(supabase, actor.userId, listingIds, "approved");

    case "reject":
      return executeTransferApproval(supabase, actor.userId, listingIds, "rejected");

    case "office_forced": {
      const staffId = request.staff_id?.trim();
      const targetOwnerId = request.target_owner_id?.trim();

      if (!staffId || !targetOwnerId) {
        throw new Error("Danışman ve devralma hedefi zorunludur.");
      }

      if (!actor.profile || !isOfficeAdmin(actor.profile)) {
        throw new Error("Bu işlem yalnızca ofis yöneticileri tarafından yapılabilir.");
      }

      if (staffId === targetOwnerId) {
        throw new Error("İlanlar aynı danışmana devredilemez.");
      }

      return executeOfficeForcedTransfer(
        supabase,
        actor.userId,
        staffId,
        targetOwnerId
      );
    }

    case "office_reassign": {
      const staffId = request.staff_id?.trim();
      const targetOwnerId = request.target_owner_id?.trim();

      if (!staffId || !targetOwnerId) {
        throw new Error("Danışman ve devralma hedefi zorunludur.");
      }

      if (!actor.profile || !profileHasTeamAccess(actor.profile)) {
        throw new Error(
          "Bu işlem yalnızca Kurumsal Ofis ve Franchise paketlerinde kullanılabilir."
        );
      }

      if (staffId === targetOwnerId) {
        throw new Error("İlanlar aynı danışmana devredilemez.");
      }

      return executeOfficePortfolioReassign(
        supabase,
        actor.userId,
        staffId,
        targetOwnerId
      );
    }

    default:
      throw new Error("Geçersiz devir tipi.");
  }
}

export async function requireTransferActor() {
  const { user, profile } = await getSessionProfile();

  if (!user || !profile) {
    return {
      ok: false as const,
      error: "Oturum bulunamadı.",
      status: 401,
    };
  }

  return {
    ok: true as const,
    userId: user.id,
    profile,
  };
}

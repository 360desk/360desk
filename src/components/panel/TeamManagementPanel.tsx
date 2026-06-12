"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ExternalAgentInviteModal } from "@/components/panel/team/ExternalAgentInviteModal";
import { InternalAgentInviteModal } from "@/components/panel/team/InternalAgentInviteModal";
import { OfficeInviteModal } from "@/components/panel/team/OfficeInviteModal";
import { TeamInviteActionsBar } from "@/components/panel/team/TeamInviteActionsBar";
import { DeactivateAgentModal } from "@/components/panel/team/DeactivateAgentModal";
import { TeamAccessUpgradeCard } from "@/components/panel/team/TeamAccessUpgradeCard";
import { EnterpriseTeamTreeView } from "@/components/panel/team/EnterpriseTeamTreeView";
import type { TeamInviteRevokeResult } from "@/components/panel/team/TeamStaffActionsMenu";
import { TransferPortfoliosModal } from "@/components/panel/team/TransferPortfoliosModal";
import {
  flattenEnterpriseTree,
  removeMemberFromEnterpriseTree,
} from "@/lib/supabase/team-tree-merge";
import {
  TEAM_INVITE_TOAST_MESSAGES,
  TeamInviteToast,
  type TeamInviteToastVariant,
} from "@/components/panel/team/TeamInviteToast";
import type { TeamInviteMode } from "@/lib/supabase/team-invite-engine";
import {
  getTeamManagementViewConfig,
  inferOfficeUserRole,
} from "@/lib/office-hierarchy";
import {
  formatTeamQuotaFullMessage,
  profileHasTeamAccess,
} from "@/lib/supabase/team-quota";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TeamMember, EnterpriseTeamTree } from "@/types/team";
import type { TeamQuotaSnapshot } from "@/types/subscription-tier";

function resolveInviteToast(mode: TeamInviteMode): {
  message: string;
  variant: TeamInviteToastVariant;
} {
  switch (mode) {
    case "external_invited":
      return {
        message: TEAM_INVITE_TOAST_MESSAGES.external_invited,
        variant: "success",
      };
    case "internal_invited":
      return {
        message: TEAM_INVITE_TOAST_MESSAGES.internal_invited,
        variant: "amber",
      };
    case "office_invited":
      return {
        message: TEAM_INVITE_TOAST_MESSAGES.office_invited,
        variant: "success",
      };
    default:
      return {
        message: TEAM_INVITE_TOAST_MESSAGES.external_invited,
        variant: "success",
      };
  }
}

export function TeamManagementPanel() {
  const { user, profile, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamTree, setTeamTree] = useState<EnterpriseTeamTree | null>(null);
  const [quota, setQuota] = useState<TeamQuotaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [externalInviteOpen, setExternalInviteOpen] = useState(false);
  const [internalInviteOpen, setInternalInviteOpen] = useState(false);
  const [officeInviteOpen, setOfficeInviteOpen] = useState(false);
  const [branchQuota, setBranchQuota] = useState<TeamQuotaSnapshot | null>(null);
  const [agentQuota, setAgentQuota] = useState<TeamQuotaSnapshot | null>(null);
  const [transferTarget, setTransferTarget] = useState<TeamMember | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<TeamMember | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    variant: TeamInviteToastVariant;
  } | null>(null);

  const hasTeamAccess = profileHasTeamAccess(profile);
  const viewConfig = getTeamManagementViewConfig(profile);
  const leaderRole = inferOfficeUserRole(profile);
  const isFranchiseMaster = leaderRole === "franchise_master";

  const fetchTeamData = useCallback(async () => {
    if (!hasTeamAccess) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const requests: Promise<Response>[] = [fetch("/api/team/members")];

    if (isFranchiseMaster) {
      requests.push(fetch("/api/team/quota?invite_role=broker_owner"));
      requests.push(fetch("/api/team/quota?invite_role=office_agent"));
    } else {
      requests.push(fetch("/api/team/quota"));
    }

    const responses = await Promise.all(requests);
    const membersResponse = responses[0];

    const membersPayload = (await membersResponse.json()) as {
      members?: TeamMember[];
      tree?: EnterpriseTeamTree;
      error?: string;
    };

    if (!membersResponse.ok) {
      setError(membersPayload.error ?? "Ekip listesi alınamadı.");
      setMembers([]);
      setTeamTree(null);
    } else {
      setMembers(membersPayload.members ?? []);
      setTeamTree(membersPayload.tree ?? null);
    }

    if (isFranchiseMaster) {
      const branchQuotaResponse = responses[1];
      const agentQuotaResponse = responses[2];
      const branchPayload = (await branchQuotaResponse.json()) as {
        quota?: TeamQuotaSnapshot;
      };
      const agentPayload = (await agentQuotaResponse.json()) as {
        quota?: TeamQuotaSnapshot;
      };

      setBranchQuota(branchPayload.quota ?? null);
      setAgentQuota(agentPayload.quota ?? null);
      setQuota(agentPayload.quota ?? null);
    } else {
      const quotaResponse = responses[1];
      const quotaPayload = (await quotaResponse.json()) as {
        quota?: TeamQuotaSnapshot;
      };

      setQuota(quotaPayload.quota ?? null);
      setBranchQuota(null);
      setAgentQuota(quotaPayload.quota ?? null);
    }

    setLoading(false);
  }, [hasTeamAccess, isFranchiseMaster]);

  useEffect(() => {
    if (!authLoading) {
      void fetchTeamData();
    }
  }, [authLoading, fetchTeamData, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
  };

  const handleInviteSuccess = (mode: TeamInviteMode) => {
    handleRefresh();
    setToast(resolveInviteToast(mode));
  };

  const handleInviteRevoked = (
    member: TeamMember,
    result: TeamInviteRevokeResult
  ) => {
    if (teamTree) {
      const nextTree = removeMemberFromEnterpriseTree(teamTree, {
        id: member.id,
        email: result.invitee_email,
        invitationId: result.invitation_id,
      });
      setTeamTree(nextTree);
      setMembers(flattenEnterpriseTree(nextTree));
    } else {
      setMembers((current) =>
        current.filter(
          (row) =>
            row.id !== member.id &&
            row.id !== result.invitation_id &&
            row.invitation_id !== result.invitation_id &&
            row.email.toLowerCase() !== result.invitee_email.toLowerCase()
        )
      );
    }

    setToast({
      message: TEAM_INVITE_TOAST_MESSAGES.invite_cancelled(result.invitee_email),
      variant: "success",
    });

    void fetchTeamData();
  };

  const brokerName = useMemo(
    () =>
      profile?.company_name || profile?.full_name || profile?.email || "Ofis",
    [profile]
  );

  const activeAgentQuota = agentQuota ?? quota;

  const handleQuotaBlocked = () => {
    const snapshot = activeAgentQuota;
    if (!snapshot) {
      return;
    }

    setToast({
      message: formatTeamQuotaFullMessage(
        snapshot.totalReservedTeamSize,
        snapshot.maxTeamMembers
      ),
      variant: "amber",
    });
  };

  const handleOfficeQuotaBlocked = () => {
    if (!branchQuota) {
      return;
    }

    setToast({
      message: formatTeamQuotaFullMessage(
        branchQuota.totalReservedTeamSize,
        branchQuota.maxTeamMembers
      ),
      variant: "amber",
    });
  };

  if (authLoading) {
    return (
      <Card className="py-16 text-center">
        <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-charcoal-light" />
        <p className="mt-4 text-cream/40">Ekip modülü yükleniyor...</p>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="py-12 text-center">
        <p className="mb-4 text-cream/60">
          Oturum bulunamadı. Panele erişmek için giriş yapın.
        </p>
        <Link href="/giris?next=/panel/ekibim">
          <Button>Giriş Yap</Button>
        </Link>
      </Card>
    );
  }

  if (!hasTeamAccess) {
    return <TeamAccessUpgradeCard />;
  }

  if (!viewConfig) {
    return (
      <Card className="py-12 text-center">
        <p className="text-cream/60">
          Ekip yönetimi yalnızca franchise master veya broker hesapları için
          kullanılabilir.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <TeamInviteToast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Kurumsal Yönetim
          </p>
          <h1 className="mt-2 text-3xl font-bold text-cream">
            {viewConfig.pageTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/55">
            {viewConfig.pageSubtitle}
          </p>
        </div>

        <TeamInviteActionsBar
          showOfficeInvite={isFranchiseMaster}
          externalQuotaFull={activeAgentQuota?.canAddTeamMember === false}
          internalQuotaFull={activeAgentQuota?.canAddTeamMember === false}
          officeQuotaFull={branchQuota?.canAddTeamMember === false}
          onExternalInvite={() => {
            if (activeAgentQuota?.canAddTeamMember === false) {
              handleQuotaBlocked();
              return;
            }
            setExternalInviteOpen(true);
          }}
          onInternalInvite={() => {
            if (activeAgentQuota?.canAddTeamMember === false) {
              handleQuotaBlocked();
              return;
            }
            setInternalInviteOpen(true);
          }}
          onOfficeInvite={() => {
            if (branchQuota?.canAddTeamMember === false) {
              handleOfficeQuotaBlocked();
              return;
            }
            setOfficeInviteOpen(true);
          }}
          onQuotaBlocked={handleQuotaBlocked}
          onOfficeQuotaBlocked={handleOfficeQuotaBlocked}
        />
      </div>

      {(activeAgentQuota?.canAddTeamMember === false ||
        branchQuota?.canAddTeamMember === false) && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          {activeAgentQuota &&
            formatTeamQuotaFullMessage(
              activeAgentQuota.totalReservedTeamSize,
              activeAgentQuota.maxTeamMembers
            )}
          {isFranchiseMaster &&
            branchQuota &&
            branchQuota.canAddTeamMember === false && (
              <span className="mt-1 block">
                {formatTeamQuotaFullMessage(
                  branchQuota.totalReservedTeamSize,
                  branchQuota.maxTeamMembers
                )}
              </span>
            )}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-cream/10 bg-charcoal-light">
          <p className="text-xs uppercase tracking-wider text-cream/40">
            {viewConfig.statLabel}
          </p>
          <p className="mt-2 text-3xl font-bold text-cream">
            {loading ? "—" : members.filter((m) => !m.is_suspended).length}
          </p>
        </Card>
        <Card className="border-cream/10 bg-charcoal-light">
          <p className="text-xs uppercase tracking-wider text-cream/40">
            Ekip Kotası
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {loading || !activeAgentQuota
              ? "—"
              : `${activeAgentQuota.totalReservedTeamSize} / ${activeAgentQuota.maxTeamMembers}`}
          </p>
          {activeAgentQuota && activeAgentQuota.pendingTeamSize > 0 && (
            <p className="mt-1 text-xs text-cream/45">
              {activeAgentQuota.currentTeamSize} aktif ·{" "}
              {activeAgentQuota.pendingTeamSize} bekleyen davet
            </p>
          )}
        </Card>
        <Card className="border-cream/10 bg-charcoal-light">
          <p className="text-xs uppercase tracking-wider text-cream/40">
            {viewConfig.leaderLabel}
          </p>
          <p className="mt-2 text-lg font-semibold text-cream line-clamp-2">
            {brokerName}
          </p>
        </Card>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <EnterpriseTeamTreeView
        tree={teamTree}
        loading={loading}
        viewMode={viewConfig.viewMode}
        onTransfer={setTransferTarget}
        onDeactivate={setDeactivateTarget}
        onResendSuccess={(email) => {
          handleRefresh();
          setToast({
            message: TEAM_INVITE_TOAST_MESSAGES.invite_resent(email),
            variant: "success",
          });
        }}
        onRevokeSuccess={handleInviteRevoked}
        onCopyTestLinkSuccess={(email) => {
          setToast({
            message: TEAM_INVITE_TOAST_MESSAGES.test_link_copied(email),
            variant: "amber",
          });
        }}
        onActionError={(message) => {
          setToast({
            message,
            variant: "amber",
          });
        }}
      />

      <ExternalAgentInviteModal
        open={externalInviteOpen}
        quota={activeAgentQuota}
        title={
          isFranchiseMaster
            ? "Sistem Dışı Yeni Merkez Danışmanı Davet Et"
            : "Sistem Dışı Yeni Danışman Davet Et"
        }
        onClose={() => setExternalInviteOpen(false)}
        onSuccess={handleInviteSuccess}
      />

      <InternalAgentInviteModal
        open={internalInviteOpen}
        quota={activeAgentQuota}
        onClose={() => setInternalInviteOpen(false)}
        onSuccess={handleInviteSuccess}
      />

      {isFranchiseMaster && (
        <OfficeInviteModal
          open={officeInviteOpen}
          quota={branchQuota}
          onClose={() => setOfficeInviteOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

      <TransferPortfoliosModal
        member={transferTarget}
        brokerId={user.id}
        brokerName={brokerName}
        teamMembers={members}
        onClose={() => setTransferTarget(null)}
        onSuccess={handleRefresh}
      />

      <DeactivateAgentModal
        member={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdForm } from "@/components/ads/AdForm";
import { ProfileCompletionGuard } from "@/components/profile/ProfileCompletionGuard";
import { OfficeInviteBanner } from "@/components/panel/OfficeInviteBanner";
import { SubscriptionUsageWidget } from "@/components/panel/SubscriptionUsageWidget";
import { MarketAnalyticsPanel } from "@/components/panel/MarketAnalyticsPanel";
import { TeamManagementPanel } from "@/components/panel/TeamManagementPanel";
import { VendorAdDashboard } from "@/components/panel/VendorAdDashboard";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { profileHasTeamAccess } from "@/lib/supabase/team-quota";
import { FinanceForm } from "@/components/finance/FinanceForm";
import { FinanceList } from "@/components/finance/FinanceList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Tab = "ilanlar" | "finans" | "pazar" | "ekibim";

function resolveInitialTab(
  searchParams: ReturnType<typeof useSearchParams>,
  canManageTeam: boolean
): Tab {
  const requestedTab = searchParams.get("tab");

  if (requestedTab === "ekibim" && canManageTeam) {
    return "ekibim";
  }

  if (requestedTab === "pazar" && canManageTeam) {
    return "pazar";
  }

  if (requestedTab === "finans") {
    return "finans";
  }

  return "ilanlar";
}

export function VendorPanel() {
  const { user, profile, loading } = useAuth();
  const searchParams = useSearchParams();
  const canManageTeam = profileHasTeamAccess(profile);
  const [activeTab, setActiveTab] = useState<Tab>("ilanlar");
  const [refreshKey, setRefreshKey] = useState(0);
  const {
    limits,
    loading: limitsLoading,
    refresh: refreshLimits,
  } = useSubscriptionLimits();

  useEffect(() => {
    setActiveTab(resolveInitialTab(searchParams, canManageTeam));
  }, [searchParams, canManageTeam]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-10 w-48 rounded-lg bg-charcoal-light animate-pulse" />
        <Card className="py-16 text-center">
          <p className="text-cream/40">Panel yükleniyor...</p>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="py-12 text-center">
        <p className="text-cream/60 mb-4">
          Oturum bulunamadı. Panele erişmek için giriş yapın.
        </p>
        <Link href="/giris?next=/panelim">
          <Button>Giriş Yap</Button>
        </Link>
      </Card>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "ilanlar", label: "İlanlarım" },
    { id: "finans", label: "Finans" },
    ...(canManageTeam
      ? [
          { id: "pazar" as const, label: "Pazar Analitiği" },
          { id: "ekibim" as const, label: "Ofis Yönetimi" },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-cream">Satıcı Paneli</h1>
        <p className="text-sm text-cream/50 mt-1">
          İlanlarınızı yönetin ve finansal kayıtlarınızı takip edin.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg bg-charcoal-light p-1 border border-cream/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary text-cream shadow-lg shadow-primary/20"
                : "text-cream/60 hover:text-cream hover:bg-cream/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <OfficeInviteBanner />

      {activeTab === "ilanlar" && (
        <div className="flex flex-col gap-6">
          <SubscriptionUsageWidget
            limits={limits}
            loading={limitsLoading}
          />

          <ProfileCompletionGuard>
            <AdForm
              vendorId={user.id}
              onSuccess={() => {
                setRefreshKey((k) => k + 1);
                void refreshLimits();
              }}
            />
          </ProfileCompletionGuard>

          <div>
            <h2 className="text-lg font-semibold text-cream mb-4">
              İlanlarım
            </h2>
            <VendorAdDashboard
              key={refreshKey}
              limits={limits}
              onLimitsChange={refreshLimits}
            />
          </div>
        </div>
      )}

      {activeTab === "pazar" && canManageTeam && <MarketAnalyticsPanel />}

      {activeTab === "ekibim" && <TeamManagementPanel />}

      {activeTab === "finans" && (
        <div className="flex flex-col gap-6">
          <FinanceForm
            userId={user.id}
            onSuccess={() => setRefreshKey((k) => k + 1)}
          />
          <div>
            <h2 className="text-lg font-semibold text-cream mb-4">
              Finansal Kayıtlar
            </h2>
            <FinanceList key={refreshKey} vendorId={user.id} />
          </div>
        </div>
      )}
    </div>
  );
}

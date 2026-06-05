"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdForm } from "@/components/ads/AdForm";
import { AdList } from "@/components/ads/AdList";
import { FinanceForm } from "@/components/finance/FinanceForm";
import { FinanceList } from "@/components/finance/FinanceList";

type Tab = "ilanlar" | "finans";

export function VendorPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("ilanlar");
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "ilanlar", label: "İlanlarım" },
    { id: "finans", label: "Finans" },
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

      {activeTab === "ilanlar" && (
        <div className="flex flex-col gap-6">
          <AdForm
            userId={user.id}
            onSuccess={() => setRefreshKey((k) => k + 1)}
          />
          <div>
            <h2 className="text-lg font-semibold text-cream mb-4">
              İlan Listesi
            </h2>
            <AdList
              key={refreshKey}
              vendorId={user.id}
              showStatus
              emptyMessage="Henüz ilan eklemediniz."
            />
          </div>
        </div>
      )}

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

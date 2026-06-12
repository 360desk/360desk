"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PendingAdsTable } from "@/components/admin/PendingAdsTable";

export default function AdminPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.push("/");
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-cream/40">Yükleniyor...</p>
      </div>
    );
  }

  if (!user || role !== "admin") {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-cream">Yönetim Paneli</h1>
        <p className="text-sm text-cream/50 mt-1">
          İlan kartına tıklayarak detay sayfasını inceleyin, ardından onaylayın veya reddedin.
        </p>
      </div>
      <PendingAdsTable />
    </div>
  );
}

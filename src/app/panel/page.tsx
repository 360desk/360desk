"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { VendorPanel } from "@/components/panel/VendorPanel";

export default function PanelPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/giris");
    }
    if (!loading && user && role === "guest") {
      router.push("/giris");
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-cream/40">Yükleniyor...</p>
      </div>
    );
  }

  if (!user || role === "guest") {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <VendorPanel />
    </div>
  );
}

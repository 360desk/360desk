"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  buildDefaultProfileQuotaSnapshot,
  fetchProfileQuotaSnapshot,
} from "@/lib/supabase/profile-quota";
import type { ProfileQuotaSnapshot } from "@/types/subscription-tier";

export function useProfileQuota() {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [quota, setQuota] = useState<ProfileQuotaSnapshot>(() =>
    buildDefaultProfileQuotaSnapshot()
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id || !profile) {
      setQuota(buildDefaultProfileQuotaSnapshot());
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const nextQuota = await fetchProfileQuotaSnapshot(
        supabase,
        profile,
        user.id
      );
      setQuota(nextQuota);
    } catch (error) {
      console.error("useProfileQuota:", error);
      setQuota(buildDefaultProfileQuotaSnapshot());
    } finally {
      setLoading(false);
    }
  }, [profile, supabase, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { quota, loading, refresh };
}

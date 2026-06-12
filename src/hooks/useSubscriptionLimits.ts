"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { fetchSubscriptionLimits } from "@/lib/supabase/subscriptions";
import type { SubscriptionLimits } from "@/types/subscription";

const EMPTY_LIMITS: SubscriptionLimits = {
  packageName: "Deneme Paketi",
  maxActiveAds: 5,
  activeAdCount: 0,
  trialDaysRemaining: 60,
  isAtLimit: false,
  canExpandVisibility: true,
};

export function useSubscriptionLimits() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [limits, setLimits] = useState<SubscriptionLimits>(EMPTY_LIMITS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setLimits(EMPTY_LIMITS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const nextLimits = await fetchSubscriptionLimits(
      supabase,
      profile,
      user.id
    );
    setLimits(nextLimits);
    setLoading(false);
  }, [supabase, profile, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { limits, loading, refresh };
}

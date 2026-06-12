"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  ensureVendorProfile,
  fetchVendorProfile,
} from "@/lib/supabase/profile";
import { resolveIsAdmin, resolveUserRole } from "@/lib/auth-role";
import { resolveRegistrationError } from "@/lib/auth/register-errors";
import { normalizeSubscriptionTier } from "@/lib/subscription-packages";
import type { Profile, UserRole } from "@/types/database";
import type { SubscriptionTier } from "@/types/subscription-tier";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    tier?: SubscriptionTier
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(
    async (authUser: User) => {
      let { profile: existing, error } = await fetchVendorProfile(
        supabase,
        authUser.id
      );

      if (error || !existing) {
        await ensureVendorProfile(supabase, authUser);
        const retry = await fetchVendorProfile(supabase, authUser.id);
        existing = retry.profile;
      }

      setProfile(existing);
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser) {
      await fetchProfile(currentUser);
    }
  }, [supabase, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        await fetchProfile(sessionUser);
      } else {
        setProfile(null);
      }

      if (mounted) {
        setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (!sessionUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Defer Supabase data calls to avoid session refresh deadlocks.
      window.setTimeout(() => {
        void fetchProfile(sessionUser).finally(() => {
          if (mounted) {
            setLoading(false);
          }
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    tier?: SubscriptionTier
  ) => {
    const subscriptionTier = normalizeSubscriptionTier(tier);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          subscription_tier: subscriptionTier,
        },
      },
    });

    const obscuredDuplicate = resolveRegistrationError({
      authError: error,
      user: data.user,
    });

    if (obscuredDuplicate && !error) {
      return { error: obscuredDuplicate };
    }

    if (error) {
      return {
        error:
          resolveRegistrationError({ authError: error }) ?? error.message,
      };
    }

    let profileError: string | null = null;

    if (data.user) {
      profileError = await ensureVendorProfile(supabase, data.user);
    }

    const resolvedProfileError = resolveRegistrationError({
      profileError,
      user: data.user,
    });

    if (resolvedProfileError) {
      return { error: resolvedProfileError };
    }

    return { error: null };
  };

  const signOut = useCallback(async () => {
    setUser(null);
    setProfile(null);
    setLoading(true);

    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (error) {
      console.error("[auth] signOut failed:", error);
    }

    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  }, [supabase]);

  const isAdmin = resolveIsAdmin(profile, user);
  const role = resolveUserRole(profile, user);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

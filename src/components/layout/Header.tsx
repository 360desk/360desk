"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { resolveIsAdmin, resolveUserRole } from "@/lib/auth-role";
import { isProfileComplete } from "@/lib/profile";
import { profileHasTeamAccess } from "@/lib/supabase/team-quota";
import { ProfessionalIdentityBadge } from "@/components/layout/ProfessionalIdentityBadge";
import { SubscriptionStatusBadge } from "@/components/layout/SubscriptionStatusBadge";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/ui/Badge";

const navLinkClass =
  "text-sm font-medium text-cream/80 hover:text-cream transition-colors duration-200";

export function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  const isUserAdmin = useMemo(
    () => resolveIsAdmin(profile, user),
    [profile, user]
  );

  const displayRole = useMemo(
    () => resolveUserRole(profile, user),
    [profile, user]
  );

  const showProfileLink =
    Boolean(user) && !isUserAdmin && displayRole === "vendor";

  const showOfficeManagement = Boolean(user) && profileHasTeamAccess(profile);
  const showSubscriptionBadge =
    Boolean(user) && !isUserAdmin && displayRole === "vendor";

  return (
    <header className="sticky top-0 z-50 border-b border-cream/10 bg-charcoal/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-cream">
            360
          </span>
          <span className="text-xl font-bold tracking-tight text-cream group-hover:text-primary transition-colors">
            desk
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4">
          <Link href="/ilanlar" className={`hidden sm:inline ${navLinkClass}`}>
            İlanlar
          </Link>

          {user ? (
            <>
              {showSubscriptionBadge && (
                <SubscriptionStatusBadge
                  profile={profile}
                  loading={loading || !profile}
                />
              )}

              {isUserAdmin ? (
                <RoleBadge role={displayRole} />
              ) : (
                profile && <ProfessionalIdentityBadge profile={profile} />
              )}

              <Link href="/panelim">
                <Button variant="secondary" size="sm">
                  Panelim
                </Button>
              </Link>

              {showOfficeManagement && (
                <Link href="/panel/ekibim">
                  <Button variant="secondary" size="sm">
                    Ofis Yönetimi
                  </Button>
                </Link>
              )}

              {isUserAdmin && (
                <Link href="/admin">
                  <Button variant="secondary" size="sm">
                    Yönetim
                  </Button>
                </Link>
              )}

              {showProfileLink && (
                <Link href="/profil">
                  <Button
                    variant="secondary"
                    size="sm"
                    className={
                      profile && !isProfileComplete(profile)
                        ? "border-primary/40"
                        : ""
                    }
                  >
                    {profile && !isProfileComplete(profile)
                      ? "Profili Tamamla"
                      : "Hesabım"}
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                disabled={signingOut}
                onClick={() => void handleSignOut()}
              >
                {signingOut ? "Çıkış..." : "Çıkış"}
              </Button>
            </>
          ) : loading ? (
            <span className="text-sm text-cream/30">...</span>
          ) : (
            <>
              <Link href="/fiyatlandirma">
                <Button variant="outline" size="sm">
                  Üye Ol
                </Button>
              </Link>
              <Link href="/giris">
                <Button size="sm">Giriş Yap</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/ui/Badge";

export function Header() {
  const { user, profile, role, loading, signOut } = useAuth();

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

        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:inline text-sm text-cream/70 hover:text-cream transition-colors"
          >
            İlanlar
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  <RoleBadge role={role} />
                  {(role === "vendor" || role === "admin") && (
                    <Link href="/panel">
                      <Button variant="secondary" size="sm">
                        Panelim
                      </Button>
                    </Link>
                  )}
                  {role === "admin" && (
                    <Link href="/admin">
                      <Button variant="secondary" size="sm">
                        Yönetim
                      </Button>
                    </Link>
                  )}
                  <span className="hidden md:inline text-sm text-cream/50">
                    {profile?.full_name || profile?.email}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    Çıkış
                  </Button>
                </>
              ) : (
                <Link href="/giris">
                  <Button size="sm">Giriş Yap</Button>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

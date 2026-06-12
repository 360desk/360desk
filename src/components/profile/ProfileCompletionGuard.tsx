"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  isProfileComplete,
  PROFILE_AD_GUARD_MESSAGE,
} from "@/lib/profile";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

function ProfileReminderBanner() {
  return (
    <Card className="overflow-hidden border-primary/25 bg-charcoal-light p-0">
      <div className="border-b border-cream/10 bg-charcoal px-5 py-4 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Profil Doğrulaması Gerekli
            </p>
            <p className="mt-2 text-sm leading-relaxed text-cream/80">
              {PROFILE_AD_GUARD_MESSAGE}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-cream/10 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-2 pb-4 text-sm text-cream/50">
          <p>• Ad soyad ve onaylı telefon numarası</p>
          <p>• Bireysel TTBS belge numarası</p>
          <p>• Bağımsız ofis ise firma adı ve kurumsal TTBS numarası</p>
        </div>

        <div className="pt-4">
          <Link href="/profil">
            <Button className="w-full sm:w-auto">Profili Tamamla</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function ProfileCompletionGuard({
  children,
}: ProfileCompletionGuardProps) {
  const { user, profile, loading } = useAuth();

  if (!user) {
    return null;
  }

  if (loading && !profile) {
    return (
      <Card className="border-cream/10 bg-charcoal-light py-8 text-center">
        <p className="text-sm text-cream/40">İlan formu alanı yükleniyor...</p>
      </Card>
    );
  }

  if (!isProfileComplete(profile)) {
    return <ProfileReminderBanner />;
  }

  return <>{children}</>;
}

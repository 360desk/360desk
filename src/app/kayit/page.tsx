import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { getSessionProfile } from "@/lib/supabase/auth-server";
import { isSubscriptionTier } from "@/lib/subscription-packages";

interface KayitPageProps {
  searchParams: Promise<{ tier?: string }>;
}

export default async function KayitPage({ searchParams }: KayitPageProps) {
  const { user } = await getSessionProfile();

  if (user) {
    redirect("/panelim");
  }

  const params = await searchParams;
  const tier = params.tier?.trim();

  if (!tier || !isSubscriptionTier(tier)) {
    redirect("/fiyatlandirma");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Suspense
        fallback={
          <div className="py-12 text-center">
            <p className="text-cream/40">Yükleniyor...</p>
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}

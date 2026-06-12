import { Suspense } from "react";
import { redirect } from "next/navigation";
import { InviteSignupForm } from "@/components/auth/InviteSignupForm";
import { getSessionProfile } from "@/lib/supabase/auth-server";
import { isSubscriptionTier } from "@/lib/subscription-packages";

interface AuthSignupPageProps {
  searchParams: Promise<{
    tier?: string;
    token?: string;
    invite_token?: string;
    invite?: string;
    email?: string;
  }>;
}

function resolveInviteToken(params: {
  token?: string;
  invite_token?: string;
  invite?: string;
}): string | null {
  return (
    params.token?.trim() ||
    params.invite_token?.trim() ||
    params.invite?.trim() ||
    null
  );
}

export default async function AuthSignupPage({
  searchParams,
}: AuthSignupPageProps) {
  const params = await searchParams;
  const inviteToken = resolveInviteToken(params);
  const email = params.email?.trim().toLowerCase();

  if (inviteToken && email) {
    const { user } = await getSessionProfile();

    if (user) {
      redirect("/panelim");
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
          <InviteSignupForm inviteToken={inviteToken} email={email} />
        </Suspense>
      </div>
    );
  }

  const tier = params.tier?.trim();

  if (tier && isSubscriptionTier(tier)) {
    redirect(`/kayit?tier=${encodeURIComponent(tier)}`);
  }

  redirect("/fiyatlandirma");
}

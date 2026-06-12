import { redirect } from "next/navigation";
import { PublicSignupPricingPanel } from "@/components/subscription/PublicSignupPricingPanel";
import { getSessionProfile } from "@/lib/supabase/auth-server";

export default async function FiyatlandirmaPage() {
  const { user } = await getSessionProfile();

  if (user) {
    redirect("/panel/uyelik");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <PublicSignupPricingPanel />
    </div>
  );
}

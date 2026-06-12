import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { isProfileComplete } from "@/lib/profile";
import { getSessionProfile } from "@/lib/supabase/auth-server";

export default async function ProfilePage() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/giris?next=/profil");
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const completed = isProfileComplete(profile);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="mb-8 rounded-xl border border-cream/10 bg-charcoal-light px-5 py-6 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Hesap Yapılandırması
        </p>
        <h1 className="mt-2 text-2xl font-bold text-cream">
          {completed ? "Profil & TTBS Doğrulama" : "Profilinizi Tamamlayın"}
        </h1>
        <p className="text-sm text-cream/50 mt-2 leading-relaxed">
          {completed
            ? "TTBS ve kurumsal kimlik bilgilerinizi güncel tutun."
            : "İlan verebilmek için aşağıdaki zorunlu doğrulama alanlarını doldurun."}
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}

import { redirect } from "next/navigation";
import { PanelShell } from "@/components/panel/PanelShell";
import { getSessionProfile } from "@/lib/supabase/auth-server";

export default async function PanelimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getSessionProfile();

  if (!user) {
    redirect("/giris?next=/panelim");
  }

  return <PanelShell>{children}</PanelShell>;
}

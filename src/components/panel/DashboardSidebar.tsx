"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { profileHasTeamAccess } from "@/lib/supabase/team-quota";

interface NavItem {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  visible?: boolean;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const showTeam = profileHasTeamAccess(profile);

  const navItems: NavItem[] = [
    {
      href: "/panelim",
      label: "Ana Panel",
      match: (path) => path === "/panelim" || path === "/panel",
    },
    {
      href: "/panel/uyelik",
      label: "Üyelik & Paketler",
      match: (path) => path.startsWith("/panel/uyelik") || path.startsWith("/panelim/uyelik"),
    },
    {
      href: "/panel/ekibim",
      label: "Ekibim",
      match: (path) => path.startsWith("/panel/ekibim") || path.startsWith("/panelim/ekibim"),
      visible: showTeam,
    },
    {
      href: "/profil",
      label: "Hesabım",
      match: (path) => path.startsWith("/profil"),
    },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-cream/10 bg-charcoal-dark lg:flex lg:flex-col">
      <div className="border-b border-cream/10 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          360desk
        </p>
        <p className="mt-1 text-sm font-semibold text-cream">Broker Paneli</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems
          .filter((item) => item.visible !== false)
          .map((item) => {
            const active = item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/15 text-cream shadow-inner shadow-primary/10 ring-1 ring-primary/25"
                    : "text-cream/60 hover:bg-cream/5 hover:text-cream"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}

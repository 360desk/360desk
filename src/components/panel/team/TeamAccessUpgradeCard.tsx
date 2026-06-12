"use client";

import Link from "next/link";
import { TEAM_MANAGEMENT_UPGRADE_MESSAGE } from "@/lib/subscription-packages";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function TeamAccessUpgradeCard() {
  return (
    <Card className="border-primary/25 bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal py-14 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Kurumsal Özellik
      </p>
      <h1 className="mt-4 text-2xl font-bold text-cream">Ekibim Modülü</h1>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-cream/60">
        {TEAM_MANAGEMENT_UPGRADE_MESSAGE}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/panel/uyelik">
          <Button>Paketi Yükselt</Button>
        </Link>
        <Link href="/panelim">
          <Button variant="secondary">Panele Dön</Button>
        </Link>
      </div>
    </Card>
  );
}

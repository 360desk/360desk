"use client";

import { DashboardSidebar } from "@/components/panel/DashboardSidebar";
import { OnboardingContractGate } from "@/components/panel/OnboardingContractGate";

export function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OnboardingContractGate />
      <div className="flex min-h-[calc(100vh-4rem)] bg-charcoal">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

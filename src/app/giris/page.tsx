import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="text-cream/40">Yükleniyor...</p>
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </div>
  );
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import {
  isOnboardingAllowedPath,
  isProtectedPanelPath,
  ONBOARDING_LOCK_REDIRECT,
  resolveOnboardingLockState,
} from "@/lib/onboarding-lock";

const AUTH_REQUIRED_ROUTES = ["/panel", "/panelim", "/profil"];

function requiresAuth(pathname: string): boolean {
  return AUTH_REQUIRED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  if (!requiresAuth(pathname)) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/giris";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedPanelPath(pathname) && !isOnboardingAllowedPath(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("contract_accepted, user_role, email")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      const email = (user.email ?? profile.email ?? "").toLowerCase();
      const admin = createAdminClient();
      const lockState = await resolveOnboardingLockState(
        admin,
        profile,
        email
      );

      if (lockState.locked) {
        const lockUrl = request.nextUrl.clone();
        lockUrl.pathname = ONBOARDING_LOCK_REDIRECT.split("?")[0];
        lockUrl.search = "?onboarding=locked";
        return NextResponse.redirect(lockUrl);
      }
    }
  }

  return supabaseResponse;
}

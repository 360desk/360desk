import type { AuthError, User } from "@supabase/supabase-js";

export const DUPLICATE_EMAIL_MESSAGE =
  "Bu e-posta adresi zaten bir hesaba ait. Lütfen şifrenizle giriş yapın veya başka bir e-posta adresi deneyin.";

type RegistrationAuthError = Pick<AuthError, "message" | "status" | "code"> | null;

export function isDuplicateEmailAuthError(
  error: RegistrationAuthError
): boolean {
  if (!error) {
    return false;
  }

  if (error.status === 422) {
    return true;
  }

  if (error.code === "user_already_exists") {
    return true;
  }

  const lower = (error.message ?? "").toLowerCase();

  return (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("user already") ||
    lower.includes("email address is already") ||
    lower.includes("duplicate key value violates unique constraint")
  );
}

export function isDuplicateEmailProfileError(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("23505") ||
    lower.includes("profiles_email_unique") ||
    (lower.includes("duplicate key") && lower.includes("email"))
  );
}

export function isObscuredDuplicateSignup(user: User | null | undefined): boolean {
  return Boolean(
    user && Array.isArray(user.identities) && user.identities.length === 0
  );
}

export function resolveRegistrationError(params: {
  authError?: RegistrationAuthError;
  profileError?: string | null;
  user?: User | null;
}): string | null {
  if (isDuplicateEmailAuthError(params.authError ?? null)) {
    return DUPLICATE_EMAIL_MESSAGE;
  }

  if (
    params.profileError &&
    isDuplicateEmailProfileError(params.profileError)
  ) {
    return DUPLICATE_EMAIL_MESSAGE;
  }

  if (isObscuredDuplicateSignup(params.user)) {
    return DUPLICATE_EMAIL_MESSAGE;
  }

  return params.authError?.message ?? params.profileError ?? null;
}

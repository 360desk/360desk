interface ProfessionalAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
};

export function ProfessionalAvatar({
  name,
  avatarUrl,
  size = "md",
}: ProfessionalAvatarProps) {
  const initials = name.trim().charAt(0).toUpperCase() || "?";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`shrink-0 rounded-xl border border-cream/15 bg-charcoal object-cover ${sizeClasses[size]}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 font-bold text-primary ${sizeClasses[size]}`}
    >
      {initials}
    </div>
  );
}

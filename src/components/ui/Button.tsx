import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-cream hover:bg-primary-dark active:scale-[0.98] shadow-lg shadow-primary/20",
  secondary:
    "bg-charcoal-light text-cream border border-cream/20 hover:border-cream/40 hover:bg-charcoal",
  ghost: "text-cream/80 hover:text-cream hover:bg-cream/5",
  outline:
    "bg-transparent text-cream/75 border border-cream/20 hover:border-primary/45 hover:text-primary hover:bg-primary/5",
  danger:
    "bg-red-900/40 text-red-300 border border-red-500/30 hover:bg-red-900/60",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

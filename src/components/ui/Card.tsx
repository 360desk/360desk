import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({
  hover = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-cream/10 bg-charcoal-light p-5 ${hover ? "transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

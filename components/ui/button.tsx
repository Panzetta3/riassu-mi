"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,var(--brand),color-mix(in_oklab,var(--brand)_70%,black))] text-white shadow-[0_10px_24px_rgba(17,46,39,0.2)] border border-white/20 hover:translate-y-[-1px] hover:shadow-[0_14px_30px_rgba(17,46,39,0.25)]",
  secondary:
    "bg-[color:var(--card)] text-[color:var(--ink)] border border-[color:var(--border)] hover:bg-[color:var(--surface-2)] hover:border-[color:color-mix(in_oklab,var(--brand)_30%,var(--border))]",
  ghost:
    "bg-transparent text-[color:var(--ink)] hover:bg-[color:color-mix(in_oklab,var(--brand)_12%,transparent)]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center px-4 py-2 rounded-full font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)] disabled:cursor-not-allowed disabled:opacity-60";

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, ButtonVariant };

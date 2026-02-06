"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 rounded-lg border transition-colors
            bg-[color:var(--card)]
            text-[color:var(--ink)]
            placeholder-[color:color-mix(in_oklab,var(--muted)_70%,transparent)]
            ${
              error
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-[color:var(--border)] focus:ring-[color:var(--ring)] focus:border-[color:var(--ring)]"
            }
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-[color:color-mix(in_oklab,var(--card)_70%,var(--surface))] disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };

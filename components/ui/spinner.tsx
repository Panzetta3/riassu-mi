"use client";

import { HTMLAttributes, forwardRef } from "react";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-3",
  lg: "w-12 h-12 border-4",
};

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = "md", className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={`inline-block ${className}`}
        {...props}
      >
        <div
          className={`${sizeStyles[size]} rounded-full border-blue-600 border-t-transparent animate-spin`}
        />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";

export { Spinner };
export type { SpinnerProps, SpinnerSize };

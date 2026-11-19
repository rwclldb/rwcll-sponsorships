"use client";

import type { ReactNode } from "react";

/** Submit button that asks "Are you sure?" first. */
export function ConfirmButton({
  message,
  className = "btn-danger",
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

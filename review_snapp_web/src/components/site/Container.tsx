import type { ReactNode } from "react";

/** Full-bleed content shell: ~50px side padding, no narrow max-width trap. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-[50px] ${className}`}>
      {children}
    </div>
  );
}

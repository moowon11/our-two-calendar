import type { ReactNode } from "react";

export function AuthCard({
  children,
  icon = "🤍",
}: {
  children: ReactNode;
  icon?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[390px] rounded-3xl border border-line bg-surface p-8 shadow-[0_18px_44px_-28px_color-mix(in_srgb,var(--ink)_45%,transparent)]">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-[74px] w-[74px] items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-primary text-3xl">
            {icon}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function BottomNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[70px] items-center justify-around border-t border-line bg-card px-2 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center justify-center rounded-xl px-4 py-2 font-hand text-base transition-transform duration-100 active:scale-90 active:bg-muted",
              active ? "text-primary" : "text-ink",
            )}
          >
            {item.label}
            {item.href === "/messages" && unreadCount > 0 && (
              <span className="absolute top-0.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

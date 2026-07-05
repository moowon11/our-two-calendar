"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-items";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "@/components/member-avatar";

export function Sidebar({
  meColor,
  meName,
  meAvatarUrl,
  partnerColor,
  partnerName,
  partnerAvatarUrl,
  unreadCount,
  unreadNotifCount,
  upcomingLabel,
}: {
  meColor: string;
  meName: string;
  meAvatarUrl?: string | null;
  partnerColor: string;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  unreadCount: number;
  unreadNotifCount: number;
  upcomingLabel: { title: string; dday: string } | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[236px] shrink-0 flex-col gap-7 border-r border-line bg-sidebar p-5.5 lg:flex">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-accent to-primary text-xl">
          🤍
        </div>
        <span className="font-hand text-2xl font-bold text-foreground">우리 달력</span>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-line bg-card px-3.5 py-3">
        <MemberAvatar url={meAvatarUrl} color={meColor} name={meName} className="h-7 w-7 text-xs" />
        <span className="text-sm text-accent">♥</span>
        <MemberAvatar
          url={partnerAvatarUrl}
          color={partnerColor}
          name={partnerName}
          className="h-7 w-7 text-xs"
        />
        <span className="ml-1 truncate font-hand text-lg text-foreground">
          {meName} &amp; {partnerName}
        </span>
      </div>

      <nav className="flex flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-[transform,background-color,color] duration-100 active:scale-95",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.href === "/messages" && unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[11px] text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
        <Link
          href="/settings"
          className={cn(
            "relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-colors",
            pathname?.startsWith("/settings")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <span>⚙️</span>설정
          {unreadNotifCount > 0 && (
            <span className="ml-auto h-2 w-2 rounded-full bg-destructive" />
          )}
        </Link>
      </nav>

      {upcomingLabel && (
        <div className="mt-auto flex flex-col gap-1 rounded-2xl border border-dashed border-accent bg-card p-3.5">
          <span className="text-xs text-muted-foreground">다가오는</span>
          <span className="font-hand text-xl font-bold text-foreground">
            {upcomingLabel.title}
          </span>
          <span className="font-hand text-2xl text-primary">{upcomingLabel.dday}</span>
        </div>
      )}
    </aside>
  );
}

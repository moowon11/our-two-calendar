import Link from "next/link";
import { MemberAvatar } from "@/components/member-avatar";

export function MobileHeader({
  meColor,
  meName,
  meAvatarUrl,
  partnerColor,
  partnerName,
  partnerAvatarUrl,
  unreadNotifCount,
}: {
  meColor: string;
  meName: string;
  meAvatarUrl?: string | null;
  partnerColor: string;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  unreadNotifCount: number;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-3 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-primary text-base">
          🤍
        </div>
        <span className="font-hand text-xl font-bold text-foreground">우리 달력</span>
      </div>
      <div className="flex items-center gap-1.5">
        <MemberAvatar url={meAvatarUrl} color={meColor} name={meName} className="h-5 w-5 text-[9px]" />
        <MemberAvatar
          url={partnerAvatarUrl}
          color={partnerColor}
          name={partnerName}
          className="h-5 w-5 text-[9px]"
        />
        <Link
          href="/settings"
          className="relative ml-1 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-transform duration-100 active:scale-90 active:bg-muted"
          aria-label="설정"
        >
          ⚙️
          {unreadNotifCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Link>
      </div>
    </header>
  );
}

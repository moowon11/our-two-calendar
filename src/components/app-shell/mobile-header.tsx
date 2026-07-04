import Link from "next/link";

export function MobileHeader({
  meColor,
  partnerColor,
}: {
  meColor: string;
  partnerColor: string;
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
        <span className="h-5 w-5 rounded-full" style={{ backgroundColor: meColor }} />
        <span className="h-5 w-5 rounded-full" style={{ backgroundColor: partnerColor }} />
        <Link
          href="/settings"
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground"
          aria-label="설정"
        >
          ⚙️
        </Link>
      </div>
    </header>
  );
}

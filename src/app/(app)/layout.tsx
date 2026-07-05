import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { nextOccurrence, ddayLabel } from "@/lib/date-utils";
import { signAvatarUrl } from "@/lib/supabase/avatar";
import { Sidebar } from "@/components/app-shell/sidebar";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { MobileHeader } from "@/components/app-shell/mobile-header";
import { PullToRefresh } from "@/components/pull-to-refresh";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionInfo();
  if (session.status === "unauthenticated") redirect("/login");
  if (session.status === "no-couple") redirect("/connect");

  const { member, couple, partner } = session;
  const supabase = await createClient();

  const [
    { count: unreadCount },
    { count: unreadNotifCount },
    { data: anniversaries },
    meAvatarUrl,
    partnerAvatarUrl,
  ] = await Promise.all([
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("to_id", member.id)
      .is("read_at", null),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", member.id)
      .is("read_at", null),
    supabase.from("anniversaries").select("*").eq("couple_id", couple.id),
    signAvatarUrl(supabase, member.avatar_url),
    signAvatarUrl(supabase, partner?.avatar_url),
  ]);

  let upcomingLabel: { title: string; dday: string } | null = null;
  if (anniversaries && anniversaries.length > 0) {
    const withNext = anniversaries.map((a) => ({
      a,
      next: nextOccurrence(a),
    }));
    withNext.sort((x, y) => x.next.getTime() - y.next.getTime());
    const soonest = withNext[0];
    upcomingLabel = { title: soonest.a.title, dday: ddayLabel(soonest.next) };
  }

  const meColor = member.color;
  const meName = member.display_name || "나";
  const partnerColor = partner?.color ?? "#A7B99A";
  const partnerName = partner?.display_name || "상대";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        meColor={meColor}
        meName={meName}
        meAvatarUrl={meAvatarUrl}
        partnerColor={partnerColor}
        partnerName={partnerName}
        partnerAvatarUrl={partnerAvatarUrl}
        myMemberId={member.id}
        initialUnreadCount={unreadCount ?? 0}
        unreadNotifCount={unreadNotifCount ?? 0}
        upcomingLabel={upcomingLabel}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileHeader
          meColor={meColor}
          meName={meName}
          meAvatarUrl={meAvatarUrl}
          partnerColor={partnerColor}
          partnerName={partnerName}
          partnerAvatarUrl={partnerAvatarUrl}
          unreadNotifCount={unreadNotifCount ?? 0}
        />
        <main className="flex-1 pb-[86px] lg:pb-0">
          <PullToRefresh>{children}</PullToRefresh>
        </main>
      </div>
      <BottomNav myMemberId={member.id} initialUnreadCount={unreadCount ?? 0} />
    </div>
  );
}

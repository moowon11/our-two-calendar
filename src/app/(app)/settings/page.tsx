import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { signOutAction } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const session = await getSessionInfo();
  if (session.status !== "connected") redirect("/login");

  const { member, couple, partner } = session;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8 lg:px-10 lg:py-10">
      <h1 className="font-hand text-3xl font-bold text-foreground">설정</h1>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">내 닉네임</span>
          <span className="text-foreground">{member.display_name || "-"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">상대 닉네임</span>
          <span className="text-foreground">{partner?.display_name || "-"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">우리 사귄 날</span>
          <span className="text-foreground">{couple.start_date || "-"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">우리 초대코드</span>
          <span className="font-hand text-lg tracking-widest text-primary">
            {couple.invite_code}
          </span>
        </div>
      </div>

      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="w-full">
          로그아웃
        </Button>
      </form>
    </div>
  );
}

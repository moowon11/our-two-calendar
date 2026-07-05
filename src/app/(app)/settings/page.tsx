import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { signAvatarUrl } from "@/lib/supabase/avatar";
import { signOutAction } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { UnlinkCoupleButton } from "./unlink-couple-button";
import { AvatarUploader } from "./avatar-uploader";
import { NicknameForm } from "./nickname-form";
import { NotificationsPanel } from "./notifications-panel";

export default async function SettingsPage() {
  const session = await getSessionInfo();
  if (session.status !== "connected") redirect("/login");

  const { member, couple, partner } = session;
  const supabase = await createClient();
  const meAvatarUrl = await signAvatarUrl(supabase, member.avatar_url);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8 lg:px-10 lg:py-10">
      <h1 className="font-hand text-3xl font-bold text-foreground">설정</h1>

      <NotificationsPanel myMemberId={member.id} />

      <AvatarUploader
        color={member.color}
        name={member.display_name || "나"}
        avatarUrl={meAvatarUrl}
      />

      <div className="rounded-2xl border border-line bg-card p-5">
        <NicknameForm initialName={member.display_name || ""} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
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

      <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-destructive/40 p-5">
        <h2 className="text-sm font-bold text-destructive">위험 구역</h2>
        <p className="text-xs text-muted-foreground">
          커플 연결을 끊으면 서로의 화면에서 공유 데이터가 보이지 않게 돼. 기록 자체는
          지워지지 않아서 같은 초대코드로 다시 연결하면 복원돼.
        </p>
        <UnlinkCoupleButton partnerName={partner?.display_name || "상대"} />
      </div>
    </div>
  );
}

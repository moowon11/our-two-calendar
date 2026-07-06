import { cache } from "react";
import { createClient } from "./server";
import type { Database } from "./types";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Couple = Database["public"]["Tables"]["couples"]["Row"];

export type SessionInfo =
  | { status: "unauthenticated" }
  | { status: "no-couple"; member: Member | null; userId: string }
  | { status: "connected"; member: Member; couple: Couple; partner: Member | null };

// 로그인/커플연결/앱 화면 세 갈래 라우팅 판단에 쓰는 단일 진입점.
// cache()로 감싸서 같은 요청(레이아웃 + 페이지가 각자 호출해도) 안에서는 한 번만 조회한다.
async function getSessionInfoUncached(): Promise<SessionInfo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!member || !member.couple_id) {
    return { status: "no-couple", member, userId: user.id };
  }

  // couple과 partner 조회는 서로 결과에 의존하지 않으므로 병렬로 실행한다.
  const [{ data: couple }, { data: partner }] = await Promise.all([
    supabase.from("couples").select("*").eq("id", member.couple_id).single(),
    supabase
      .from("members")
      .select("*")
      .eq("couple_id", member.couple_id)
      .neq("id", user.id)
      .maybeSingle(),
  ]);

  return { status: "connected", member, couple: couple!, partner };
}

export const getSessionInfo = cache(getSessionInfoUncached);

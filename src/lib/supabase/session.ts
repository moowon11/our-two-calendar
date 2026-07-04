import { createClient } from "./server";
import type { Database } from "./types";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Couple = Database["public"]["Tables"]["couples"]["Row"];

export type SessionInfo =
  | { status: "unauthenticated" }
  | { status: "no-couple"; member: Member | null; userId: string }
  | { status: "connected"; member: Member; couple: Couple; partner: Member | null };

// 로그인/커플연결/앱 화면 세 갈래 라우팅 판단에 쓰는 단일 진입점.
export async function getSessionInfo(): Promise<SessionInfo> {
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

  const { data: couple } = await supabase
    .from("couples")
    .select("*")
    .eq("id", member.couple_id)
    .single();

  const { data: partner } = await supabase
    .from("members")
    .select("*")
    .eq("couple_id", member.couple_id)
    .neq("id", user.id)
    .maybeSingle();

  return { status: "connected", member, couple: couple!, partner };
}

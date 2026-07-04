"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionInfo } from "@/lib/supabase/session";

export type NicknameActionState = { error: string | null; success?: boolean };

export async function updateNicknameAction(
  _prevState: NicknameActionState,
  formData: FormData,
): Promise<NicknameActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!displayName) return { error: "닉네임을 입력해줘" };
  if (displayName.length > 20) return { error: "닉네임은 20자 이내로 해줘" };

  const session = await getSessionInfo();
  if (session.status !== "connected") return { error: "로그인이 필요해" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ display_name: displayName })
    .eq("id", session.member.id);

  if (error) return { error: "닉네임을 저장하지 못했어" };

  revalidatePath("/", "layout");
  return { error: null, success: true };
}

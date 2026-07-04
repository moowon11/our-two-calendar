"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string | null };

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해줘" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "이메일이나 비밀번호가 맞지 않아. 다시 확인해줄래?" };
  }

  const { data: member } = await supabase
    .from("members")
    .select("couple_id")
    .eq("id", data.user.id)
    .maybeSingle();

  redirect(member?.couple_id ? "/calendar" : "/connect");
}

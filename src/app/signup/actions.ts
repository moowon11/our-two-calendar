"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignUpActionState = {
  error: string | null;
  needsEmailConfirm: boolean;
};

export async function signUpAction(
  _prevState: SignUpActionState,
  formData: FormData,
): Promise<SignUpActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!displayName || !email || !password) {
    return { error: "닉네임·이메일·비밀번호를 모두 입력해줘", needsEmailConfirm: false };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상으로 해줘", needsEmailConfirm: false };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호 확인이 일치하지 않아", needsEmailConfirm: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    const message = error.message.includes("already registered")
      ? "이미 가입된 이메일이야. 로그인해볼래?"
      : "가입 중에 문제가 생겼어. 다시 시도해줄래?";
    return { error: message, needsEmailConfirm: false };
  }

  if (!data.session) {
    // 이메일 확인이 켜져 있는 프로젝트 — 확인 후에 세션이 생긴다.
    return { error: null, needsEmailConfirm: true };
  }

  await supabase
    .from("members")
    .upsert(
      { id: data.user!.id, user_id: data.user!.id, display_name: displayName },
      { onConflict: "id" },
    );

  redirect("/connect");
}

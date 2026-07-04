"use server";

import { createClient } from "@/lib/supabase/server";

export type CreateCoupleState = { error: string | null; code: string | null };
export type JoinCoupleState = { error: string | null; joined: boolean };

export async function createCoupleAction(
  _prevState: CreateCoupleState,
  formData: FormData,
): Promise<CreateCoupleState> {
  const startDate = String(formData.get("startDate") ?? "");
  if (!startDate) {
    return { error: "우리 사귄 날을 골라줘", code: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_couple", {
    p_start_date: startDate,
    p_display_name: "",
  });

  if (error) {
    return {
      error: error.message.includes("already in a couple")
        ? "이미 연결된 커플이 있어"
        : "코드를 만들지 못했어. 다시 시도해줄래?",
      code: null,
    };
  }

  return { error: null, code: data as string };
}

export async function joinCoupleAction(
  _prevState: JoinCoupleState,
  formData: FormData,
): Promise<JoinCoupleState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    return { error: "받은 코드를 입력해줘", joined: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_couple", {
    p_code: code,
    p_display_name: "",
  });

  if (error) {
    const message = error.message.includes("invalid code")
      ? "앗, 그 코드는 못 찾았어. 한 번만 다시 확인해줄래?"
      : error.message.includes("couple is full")
        ? "이미 두 명이 연결된 커플이야"
        : "연결하지 못했어. 다시 시도해줄래?";
    return { error: message, joined: false };
  }

  return { error: null, joined: true };
}

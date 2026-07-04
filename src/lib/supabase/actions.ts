"use server";

import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type UnlinkCoupleState = { error: string | null };

export async function unlinkCoupleAction(): Promise<UnlinkCoupleState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("unlink_couple");
  if (error) {
    return { error: "커플 연결을 끊지 못했어. 다시 시도해줄래?" };
  }
  redirect("/connect");
}

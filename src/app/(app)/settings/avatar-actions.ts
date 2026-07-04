"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionInfo } from "@/lib/supabase/session";
import { avatarStoragePath } from "@/lib/supabase/avatar";

export type AvatarActionState = { error: string | null };

export async function uploadAvatarAction(
  _prevState: AvatarActionState,
  formData: FormData,
): Promise<AvatarActionState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "사진을 골라줘" };

  const session = await getSessionInfo();
  if (session.status !== "connected") return { error: "로그인이 필요해" };

  const supabase = await createClient();
  const path = avatarStoragePath(session.couple.id, session.member.id);

  const upload = await supabase.storage.from("photos").upload(path, file, {
    contentType: "image/webp",
    upsert: true,
  });
  if (upload.error) return { error: "사진 업로드에 실패했어. 다시 시도해줄래?" };

  const update = await supabase
    .from("members")
    .update({ avatar_url: path })
    .eq("id", session.member.id);
  if (update.error) return { error: "프로필 사진을 저장하지 못했어" };

  revalidatePath("/", "layout");
  return { error: null };
}

export async function removeAvatarAction() {
  const session = await getSessionInfo();
  if (session.status !== "connected") return;

  const supabase = await createClient();
  if (session.member.avatar_url) {
    await supabase.storage.from("photos").remove([session.member.avatar_url]);
  }
  await supabase.from("members").update({ avatar_url: null }).eq("id", session.member.id);
  revalidatePath("/", "layout");
}

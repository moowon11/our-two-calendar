"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionInfo } from "@/lib/supabase/session";

export type NoteActionState = { error: string | null };

export async function saveNoteAction(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const date = String(formData.get("date") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!date) return { error: "날짜가 없어" };

  const session = await getSessionInfo();
  if (session.status !== "connected") return { error: "로그인이 필요해" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("notes")
    .select("id")
    .eq("couple_id", session.couple.id)
    .eq("note_date", date)
    .eq("author_id", session.member.id)
    .maybeSingle();

  const result = existing
    ? await supabase.from("notes").update({ content }).eq("id", existing.id)
    : await supabase.from("notes").insert({
        couple_id: session.couple.id,
        note_date: date,
        content,
        author_id: session.member.id,
      });

  if (result.error) return { error: "저장하지 못했어. 다시 시도해줄래?" };

  revalidatePath(`/day/${date}`);
  return { error: null };
}

export type PhotoActionState = { error: string | null };

export async function uploadPhotoAction(
  _prevState: PhotoActionState,
  formData: FormData,
): Promise<PhotoActionState> {
  const date = String(formData.get("date") ?? "");
  const file = formData.get("file") as File | null;
  if (!date || !file || file.size === 0) return { error: "사진을 골라줘" };

  const session = await getSessionInfo();
  if (session.status !== "connected") return { error: "로그인이 필요해" };

  const supabase = await createClient();
  const [yyyy, mm] = date.split("-");
  const path = `${session.couple.id}/${yyyy}/${mm}/${crypto.randomUUID()}.webp`;

  const upload = await supabase.storage.from("photos").upload(path, file, {
    contentType: "image/webp",
  });
  if (upload.error) return { error: "사진 업로드에 실패했어. 다시 시도해줄래?" };

  const insert = await supabase.from("photos").insert({
    couple_id: session.couple.id,
    storage_path: path,
    photo_date: date,
    attached_to_type: "date",
    attached_to_id: null,
  });
  if (insert.error) {
    await supabase.storage.from("photos").remove([path]);
    return { error: "사진 정보를 저장하지 못했어" };
  }

  revalidatePath(`/day/${date}`);
  return { error: null };
}

export async function deletePhotoAction(
  photoId: string,
  storagePath: string,
  date: string,
) {
  const supabase = await createClient();
  await supabase.storage.from("photos").remove([storagePath]);
  await supabase.from("photos").delete().eq("id", photoId);
  revalidatePath(`/day/${date}`);
}

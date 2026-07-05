"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionInfo } from "@/lib/supabase/session";
import { createNotification } from "@/lib/notifications";
import type { Database } from "@/lib/supabase/types";

type RepeatRule = Database["public"]["Tables"]["events"]["Row"]["repeat_rule"];

export type EventActionState = {
  error: string | null;
  eventId: string | null;
  date: string | null;
};

export async function saveEventAction(
  _prevState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const id = String(formData.get("id") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("event_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "") || null;
  const startTime = String(formData.get("start_time") ?? "") || null;
  const endTime = String(formData.get("end_time") ?? "") || null;
  const owner = String(formData.get("owner") ?? "shared");
  const memo = String(formData.get("memo") ?? "").trim() || null;
  const repeatRule = String(formData.get("repeat_rule") ?? "none") as RepeatRule;

  if (!title || !date) {
    return { error: "제목과 날짜는 꼭 입력해줘", eventId: id, date };
  }
  if (endDate && endDate < date) {
    return { error: "종료 날짜는 시작 날짜보다 빠를 수 없어", eventId: id, date };
  }

  const session = await getSessionInfo();
  if (session.status !== "connected") {
    return { error: "로그인이 필요해", eventId: id, date };
  }

  const ownerKind = owner === "shared" ? "shared" : "individual";
  const ownerId =
    owner === "me"
      ? session.member.id
      : owner === "partner"
        ? (session.partner?.id ?? null)
        : null;

  const supabase = await createClient();
  const payload = {
    couple_id: session.couple.id,
    title,
    event_date: date,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    owner_kind: ownerKind as "shared" | "individual",
    owner_id: ownerId,
    memo,
    repeat_rule: repeatRule,
    updated_by: session.member.id,
  };

  const result = id
    ? await supabase.from("events").update(payload).eq("id", id).select("id").single()
    : await supabase.from("events").insert(payload).select("id").single();

  if (result.error || !result.data) {
    return { error: "저장하지 못했어. 방금 쓴 내용은 그대로 남아있어", eventId: id, date };
  }

  if (!id && session.partner) {
    const actorName = session.member.display_name || "상대방";
    await createNotification(supabase, {
      coupleId: session.couple.id,
      recipientId: session.partner.id,
      type: "event",
      title: `${actorName}님이 새 일정을 추가했어: ${title}`,
      refDate: date,
      refId: result.data.id,
    });
  }

  revalidatePath("/calendar");
  revalidatePath(`/day/${date}`);
  return { error: null, eventId: result.data.id, date };
}

export async function deleteEventAction(id: string, date: string) {
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/calendar");
  revalidatePath(`/day/${date}`);
}

export type EventPhotoActionState = { error: string | null };

export async function uploadEventPhotoAction(
  _prevState: EventPhotoActionState,
  formData: FormData,
): Promise<EventPhotoActionState> {
  const eventId = String(formData.get("eventId") ?? "");
  const date = String(formData.get("date") ?? "");
  const file = formData.get("file") as File | null;
  if (!eventId || !date || !file || file.size === 0) {
    return { error: "사진을 골라줘" };
  }

  const session = await getSessionInfo();
  if (session.status !== "connected") return { error: "로그인이 필요해" };

  const supabase = await createClient();
  const [yyyy, mm] = date.split("-");
  const path = `${session.couple.id}/${yyyy}/${mm}/${crypto.randomUUID()}.webp`;

  const upload = await supabase.storage.from("photos").upload(path, file, {
    contentType: "image/webp",
  });
  if (upload.error) return { error: "사진 업로드에 실패했어" };

  const insert = await supabase.from("photos").insert({
    couple_id: session.couple.id,
    storage_path: path,
    photo_date: date,
    attached_to_type: "event",
    attached_to_id: eventId,
  });
  if (insert.error) {
    await supabase.storage.from("photos").remove([path]);
    return { error: "사진 정보를 저장하지 못했어" };
  }

  revalidatePath(`/day/${date}`);
  return { error: null };
}

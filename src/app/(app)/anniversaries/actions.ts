"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionInfo } from "@/lib/supabase/session";
import { createNotification } from "@/lib/notifications";

export type AnniversaryActionState = { error: string | null };

export async function createAnniversaryAction(
  _prevState: AnniversaryActionState,
  formData: FormData,
): Promise<AnniversaryActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const annDate = String(formData.get("ann_date") ?? "");
  const repeatYearly = formData.get("repeat_yearly") === "on";

  if (!title || !annDate) return { error: "이름과 날짜를 모두 입력해줘" };

  const session = await getSessionInfo();
  if (session.status !== "connected") return { error: "로그인이 필요해" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anniversaries")
    .insert({
      couple_id: session.couple.id,
      title,
      ann_date: annDate,
      repeat_yearly: repeatYearly,
      updated_by: session.member.id,
    })
    .select("id")
    .single();

  if (error) return { error: "저장하지 못했어. 다시 시도해줄래?" };

  if (session.partner) {
    const actorName = session.member.display_name || "상대방";
    await createNotification(supabase, {
      coupleId: session.couple.id,
      recipientId: session.partner.id,
      type: "anniversary",
      title: `${actorName}님이 새 기념일을 추가했어: ${title}`,
      refDate: annDate,
      refId: data?.id ?? null,
    });
  }

  revalidatePath("/anniversaries");
  return { error: null };
}

export async function updateAnniversaryAction(
  _prevState: AnniversaryActionState,
  formData: FormData,
): Promise<AnniversaryActionState> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const annDate = String(formData.get("ann_date") ?? "");
  if (!id || !title || !annDate) return { error: "이름과 날짜를 모두 입력해줘" };

  const session = await getSessionInfo();
  if (session.status !== "connected") return { error: "로그인이 필요해" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("anniversaries")
    .update({ title, ann_date: annDate, updated_by: session.member.id })
    .eq("id", id);

  if (error) return { error: "수정하지 못했어. 다시 시도해줄래?" };

  revalidatePath("/anniversaries");
  return { error: null };
}

export async function deleteAnniversaryAction(id: string) {
  const supabase = await createClient();
  await supabase.from("anniversaries").delete().eq("id", id);
  revalidatePath("/anniversaries");
}

export async function toggleAnniversaryFieldAction(
  id: string,
  field: "repeat_yearly" | "pinned_to_widget",
  value: boolean,
) {
  const supabase = await createClient();
  const patch = field === "repeat_yearly" ? { repeat_yearly: value } : { pinned_to_widget: value };
  await supabase.from("anniversaries").update(patch).eq("id", id);
  revalidatePath("/anniversaries");
  revalidatePath("/calendar");
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type NotificationType = Database["public"]["Tables"]["notifications"]["Row"]["type"];

// 일정/기념일 추가, 쪽지 전송 시 상대방에게 알림 하나를 남긴다.
// 알림 저장은 부가 기능이라 실패해도 원래 동작(일정 저장 등)은 막지 않는다.
export async function createNotification(
  supabase: SupabaseClient<Database>,
  params: {
    coupleId: string;
    recipientId: string;
    type: NotificationType;
    title: string;
    refDate?: string | null;
    refId?: string | null;
  },
) {
  await supabase.from("notifications").insert({
    couple_id: params.coupleId,
    recipient_id: params.recipientId,
    type: params.type,
    title: params.title,
    ref_date: params.refDate ?? null,
    ref_id: params.refId ?? null,
  });
}

export const NOTIFICATION_ICON: Record<NotificationType, string> = {
  event: "🗓️",
  anniversary: "🎉",
  message: "💌",
};

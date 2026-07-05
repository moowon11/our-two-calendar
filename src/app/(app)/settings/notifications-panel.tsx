"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/supabase/use-realtime-table";
import { NOTIFICATION_ICON } from "@/lib/notifications";
import type { Database } from "@/lib/supabase/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

function notificationHref(n: NotificationRow): string {
  if (n.type === "message") return "/messages";
  if (n.ref_date) return `/day/${n.ref_date}`;
  return n.type === "anniversary" ? "/anniversaries" : "/calendar";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return time;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`;
}

export function NotificationsPanel({ myMemberId }: { myMemberId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", myMemberId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      setStatus("error");
      return;
    }
    setNotifications(data);
    setStatus("success");

    const unreadIds = data.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length > 0) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in(
        "id",
        unreadIds,
      );
      // 사이드바/모바일 헤더의 "설정" 빨간 점은 layout.tsx(서버 컴포넌트)가 렌더 시점에
      // 계산해 내려주는 값이라, 방금 읽음 처리한 걸 반영하려면 레이아웃을 다시 불러야 한다.
      router.refresh();
    }
  }, [myMemberId, router]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable<NotificationRow>(
    "notifications",
    `recipient_id=eq.${myMemberId}`,
    (payload) => {
      if (payload.eventType !== "INSERT") return;
      const row = payload.new;
      setNotifications((prev) => (prev.some((n) => n.id === row.id) ? prev : [row, ...prev]));
      const supabase = createClient();
      supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", row.id)
        .then(() => {});
    },
  );

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-line bg-card p-5 text-center text-sm text-muted-foreground">
        알림을 불러오지 못했어
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-5">
      <h2 className="text-sm font-bold text-muted-foreground">알림</h2>

      {status === "loading" ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-4 text-center">
          <span className="text-2xl">🔔</span>
          <p className="text-sm text-muted-foreground">아직 알림이 없어</p>
        </div>
      ) : (
        <ul className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={notificationHref(n)}
                className="flex items-start gap-2.5 rounded-xl px-2 py-2 hover:bg-muted"
              >
                <span className="text-lg leading-none">{NOTIFICATION_ICON[n.type]}</span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm text-foreground">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(n.created_at)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

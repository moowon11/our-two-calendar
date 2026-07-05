"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";
import { useRealtimeTable } from "./use-realtime-table";
import type { Database } from "./types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

// 쪽지 뱃지(사이드바/하단 탭의 점·숫자)를 실시간으로 유지한다.
// 새 쪽지가 오면 즉시 늘고, 읽음 처리되면(내가 쪽지함을 열어서) 즉시 준다 —
// 둘 다 layout.tsx가 다시 렌더될 때까지 기다리지 않고 이 훅 혼자 반영한다.
export function useUnreadMessageCount(myMemberId: string, initialCount: number): number {
  const [unreadIds, setUnreadIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("messages")
      .select("id")
      .eq("to_id", myMemberId)
      .is("read_at", null)
      .then(({ data }) => {
        if (!cancelled && data) setUnreadIds(new Set(data.map((m) => m.id)));
      });
    return () => {
      cancelled = true;
    };
  }, [myMemberId]);

  useRealtimeTable<MessageRow>("messages", `to_id=eq.${myMemberId}`, (payload) => {
    setUnreadIds((prev) => {
      const next = new Set(prev ?? []);
      if (payload.eventType === "INSERT") {
        if (!payload.new.read_at) next.add(payload.new.id);
      } else if (payload.eventType === "UPDATE") {
        if (payload.new.read_at) next.delete(payload.new.id);
        else next.add(payload.new.id);
      }
      return next;
    });
  });

  return unreadIds?.size ?? initialCount;
}

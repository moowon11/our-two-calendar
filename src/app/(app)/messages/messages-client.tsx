"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/supabase/use-realtime-table";
import { createNotification } from "@/lib/notifications";
import type { Database } from "@/lib/supabase/types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export function MessagesClient({
  coupleId,
  myMemberId,
  partnerId,
  partnerName,
  partnerColor,
  meColor,
  meName,
}: {
  coupleId: string;
  myMemberId: string;
  partnerId: string;
  partnerName: string;
  partnerColor: string;
  meColor: string;
  meName: string;
}) {
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: true });

    if (error) {
      setStatus("error");
      return;
    }
    setMessages(data);
    setStatus("success");

    const unreadIds = data
      .filter((m) => m.to_id === myMemberId && !m.read_at)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);
    }
  }, [coupleId, myMemberId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useRealtimeTable<MessageRow>("messages", `couple_id=eq.${coupleId}`, (payload) => {
    if (payload.eventType === "INSERT") {
      const row = payload.new;
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
      if (row.to_id === myMemberId) {
        const supabase = createClient();
        supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("id", row.id)
          .then(() => {});
      }
    } else if (payload.eventType === "UPDATE") {
      const row = payload.new;
      setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
    }
  });

  const send = async () => {
    const content = draft.trim();
    if (!content || isSending) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ couple_id: coupleId, content, from_id: myMemberId, to_id: partnerId })
      .select()
      .single();
    setSending(false);
    if (!error && data) {
      setDraft("");
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
      const preview = content.length > 40 ? `${content.slice(0, 40)}…` : content;
      await createNotification(supabase, {
        coupleId,
        recipientId: partnerId,
        type: "message",
        title: `${meName}님의 쪽지: ${preview}`,
        refId: data.id,
      });
    }
  };

  if (status === "error") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-4xl">😢</span>
        <p className="text-foreground">쪽지를 불러오지 못했어</p>
        <Button onClick={load}>다시 시도</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col px-5 py-4 lg:h-screen lg:px-8 lg:py-6">
      <h1 className="mb-4 font-hand text-2xl font-bold text-foreground">쪽지</h1>

      <div className="flex-1 overflow-y-auto">
        {status === "loading" ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="ml-auto h-10 w-2/3 rounded-2xl" />
            <Skeleton className="h-10 w-2/3 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="text-3xl">💌</span>
            <p className="font-hand text-lg font-bold text-foreground">
              아직 쪽지가 없어. 먼저 마음을 전해볼까?
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {messages.map((m) => {
              const mine = m.from_id === myMemberId;
              return (
                <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex max-w-[75%] flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}
                  >
                    <div
                      className="rounded-2xl px-4 py-2.5 text-sm"
                      style={{
                        backgroundColor: mine ? meColor : partnerColor,
                        color: "var(--surface)",
                      }}
                    >
                      {m.content}
                    </div>
                    <span className="px-1 text-[11px] text-muted-foreground">
                      {mine && m.read_at ? "읽음 · " : ""}
                      {new Date(m.created_at).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </li>
              );
            })}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>

      <div className="mt-3 flex gap-2 border-t border-line pt-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={`${partnerName}에게 쪽지 보내기`}
          maxLength={500}
          className="min-h-[44px] flex-1 resize-none"
        />
        <Button onClick={send} disabled={isSending || !draft.trim()} className="self-end">
          보내기
        </Button>
      </div>
    </div>
  );
}

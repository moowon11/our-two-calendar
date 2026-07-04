"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import {
  createCoupleAction,
  joinCoupleAction,
  type CreateCoupleState,
  type JoinCoupleState,
} from "./actions";

const createInitial: CreateCoupleState = { error: null, code: null };
const joinInitial: JoinCoupleState = { error: null, joined: false };

type Member = { id: string; display_name: string };

function CreateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-11 rounded-full">
      {pending ? "만드는 중..." : "코드 만들기"}
    </Button>
  );
}

function JoinSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="secondary" className="h-11 px-5">
      {pending ? "연결 중..." : "연결"}
    </Button>
  );
}

export function ConnectClient({ userId }: { userId: string }) {
  const [createState, createFormAction] = useActionState(
    createCoupleAction,
    createInitial,
  );
  const [joinState, joinFormAction] = useActionState(joinCoupleAction, joinInitial);

  const [view, setView] = useState<"form" | "waiting" | "success">("form");
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partners, setPartners] = useState<Member[]>([]);

  // 내가 코드를 만들면 대기 화면으로 전환하고, couple_id를 알아내 실시간 구독을 건다.
  useEffect(() => {
    if (!createState.code || view !== "form") return;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("couples")
        .select("id")
        .eq("invite_code", createState.code!)
        .single();
      if (data) setCoupleId(data.id);
      setView("waiting");
    })();
  }, [createState.code, view]);

  // 상대가 코드를 입력해 들어오면 즉시 성공 화면으로.
  useEffect(() => {
    if (joinState.joined) setView("success");
  }, [joinState.joined]);

  // 대기 중일 때 members 테이블 실시간 구독 — 상대가 들어오면 성공 화면으로.
  useEffect(() => {
    if (view !== "waiting" || !coupleId) return;
    const supabase = createClient();

    const checkPartner = async () => {
      const { data } = await supabase
        .from("members")
        .select("id, display_name")
        .eq("couple_id", coupleId);
      if (data && data.length >= 2) {
        setPartners(data);
        setView("success");
      }
    };

    const channel = supabase
      .channel(`connect-${coupleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `couple_id=eq.${coupleId}` },
        checkPartner,
      )
      .subscribe();

    checkPartner();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [view, coupleId]);

  if (view === "success") {
    const me = partners.find((p) => p.id === userId);
    const partner = partners.find((p) => p.id !== userId);
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative flex h-[120px] w-[120px] items-center justify-center">
          <span className="absolute h-[120px] w-[120px] rounded-full bg-[radial-gradient(circle,var(--accent),transparent_70%)]" />
          <span className="text-6xl">💞</span>
        </div>
        <p className="font-hand text-3xl font-bold leading-tight text-foreground">
          연결됐어!
          <br />
          이제 우리 이야기 시작하자
        </p>
        {(me || partner) && (
          <div className="flex items-center gap-3 rounded-2xl bg-muted px-5 py-3.5">
            <span className="h-[30px] w-[30px] rounded-full bg-primary" />
            <span className="font-hand text-2xl text-foreground">
              {me?.display_name || "나"}
            </span>
            <span className="text-lg text-accent">♥</span>
            <span className="font-hand text-2xl text-foreground">
              {partner?.display_name || "상대"}
            </span>
            <span className="h-[30px] w-[30px] rounded-full bg-secondary" />
          </div>
        )}
        <Button asChild className="h-12 px-10 font-hand text-xl font-bold">
          <Link href="/calendar">달력 열기</Link>
        </Button>
      </div>
    );
  }

  if (view === "waiting") {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-accent bg-gradient-to-br from-accent/15 to-transparent">
          <span className="text-4xl">🕊️</span>
        </div>
        <p className="font-hand text-2xl font-bold text-foreground">
          상대가 들어오길 기다리는 중이야
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          코드를 보내줬어. 연결되면 바로 알려줄게, 조금만 기다려줄래?
        </p>
        <div className="flex items-center gap-2 rounded-full border border-line px-5 py-2 font-hand text-2xl tracking-widest text-primary">
          {createState.code}
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-hand text-3xl font-bold text-foreground">둘을 이어볼까?</h1>

      <form action={createFormAction} className="flex flex-col gap-3">
        {createState.error && (
          <Alert variant="destructive">
            <AlertDescription>{createState.error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">우리 사귄 날</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <CreateSubmitButton />
      </form>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-line" />
        또는 받은 코드 입력
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={joinFormAction} className="flex flex-col gap-3">
        {joinState.error && (
          <Alert variant="destructive">
            <AlertDescription>{joinState.error}</AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2">
          <Input
            name="code"
            type="text"
            aria-label="받은 초대코드"
            placeholder="코드를 붙여넣어"
            required
            className="flex-1 uppercase"
          />
          <JoinSubmitButton />
        </div>
      </form>
    </div>
  );
}

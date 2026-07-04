"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/supabase/use-realtime-table";
import {
  buildMonthGrid,
  daysSince,
  ddayLabel,
  expandEventsForMonth,
  nextOccurrence,
  toDateKey,
} from "@/lib/date-utils";
import { resolveOwnerLabel, ownerChipClass } from "@/lib/owner-label";
import { MemberAvatar } from "@/components/member-avatar";
import type { Database } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type AnniversaryRow = Database["public"]["Tables"]["anniversaries"]["Row"];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarClient({
  coupleId,
  startDate,
  myMemberId,
  meColor,
  meName,
  meAvatarUrl,
  partnerColor,
  partnerName,
  partnerAvatarUrl,
}: {
  coupleId: string;
  startDate: string | null;
  myMemberId: string;
  meColor: string;
  meName: string;
  meAvatarUrl?: string | null;
  partnerColor: string;
  partnerName: string;
  partnerAvatarUrl?: string | null;
}) {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [anniversaries, setAnniversaries] = useState<AnniversaryRow[]>([]);
  const [flashDate, setFlashDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    const supabase = createClient();

    const [eventsRes, annRes] = await Promise.all([
      supabase.from("events").select("*").eq("couple_id", coupleId),
      supabase.from("anniversaries").select("*").eq("couple_id", coupleId),
    ]);

    if (eventsRes.error || annRes.error) {
      setStatus("error");
      return;
    }

    setEvents(eventsRes.data);
    setAnniversaries(annRes.data);
    setStatus("success");
  }, [coupleId, year, month]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable<EventRow>("events", `couple_id=eq.${coupleId}`, (payload) => {
    const row = (payload.new ?? payload.old) as EventRow | undefined;
    if (row?.event_date) {
      setFlashDate(row.event_date);
      setTimeout(() => setFlashDate(null), 2500);
    }
    load();
  });

  const eventsByDate = useMemo(
    () => expandEventsForMonth(events, year, month),
    [events, year, month],
  );

  const upcoming = useMemo(() => {
    if (anniversaries.length === 0) return null;
    const withNext = anniversaries.map((a) => ({ a, next: nextOccurrence(a) }));
    withNext.sort((x, y) => x.next.getTime() - y.next.getTime());
    return withNext[0];
  }, [anniversaries]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayKey = toDateKey(today);
  const hasAnyEventThisMonth = eventsByDate.size > 0;

  const goPrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  if (status === "error") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-4xl">😢</span>
        <p className="text-foreground">달력을 불러오지 못했어</p>
        <Button onClick={load}>다시 시도</Button>
      </div>
    );
  }

  return (
    <div className="relative px-5 py-6 lg:px-8 lg:py-7">
      {/* D+ 위젯 + 다가오는 기념일 */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="flex flex-1 items-center justify-between rounded-2xl border border-line bg-gradient-to-br from-accent/25 to-transparent px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground lg:text-sm">
              우리 만난 지
            </span>
            {startDate ? (
              <>
                <span className="font-hand text-3xl font-bold leading-none text-primary lg:text-4xl">
                  D+{daysSince(startDate, today)}일
                </span>
                <span className="text-[11px] text-muted-foreground lg:text-sm">
                  {startDate} 부터 하루도 빠짐없이
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                사귄 날을 설정해줘
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MemberAvatar url={meAvatarUrl} color={meColor} name={meName} className="h-9 w-9 text-sm" />
            <span className="text-lg text-accent">♥</span>
            <MemberAvatar
              url={partnerAvatarUrl}
              color={partnerColor}
              name={partnerName}
              className="h-9 w-9 text-sm"
            />
          </div>
        </div>
        {upcoming && (
          <Link
            href="/anniversaries"
            className="flex min-w-[200px] flex-col justify-center gap-0.5 rounded-2xl border border-line bg-muted px-5 py-4"
          >
            <span className="text-xs font-bold text-secondary">다가오는 기념일</span>
            <span className="font-hand text-xl font-bold text-foreground">
              {upcoming.a.title}
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-bold text-primary">{ddayLabel(upcoming.next, today)}</span>
            </span>
          </Link>
        )}
      </div>

      {/* 월 스위처 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-hand text-2xl font-bold text-foreground lg:text-3xl">
            {year}년 {month}월
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={goPrevMonth}
              aria-label="이전 달"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted-foreground"
            >
              ‹
            </button>
            <button
              onClick={goNextMonth}
              aria-label="다음 달"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted-foreground"
            >
              ›
            </button>
          </div>
        </div>
        <button
          onClick={goToday}
          className="rounded-full bg-accent/25 px-3.5 py-1.5 text-xs text-primary"
        >
          오늘
        </button>
      </div>

      {status === "loading" ? (
        <div className="grid grid-cols-7 gap-0.5 lg:gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-lg lg:h-[104px] lg:rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {!hasAnyEventThisMonth && (
            <div className="mb-3 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-accent bg-card px-5 py-6 text-center">
              <span className="text-3xl">📖</span>
              <p className="font-hand text-lg font-bold text-foreground">
                아직 텅 빈 달력이야, 첫 일정을 남겨볼까?
              </p>
              <Button asChild size="sm" className="mt-1">
                <Link href={`/events/new?date=${todayKey}`}>일정 추가하기</Link>
              </Button>
            </div>
          )}

          <div className="mb-1 grid grid-cols-7">
            {WEEKDAYS.map((w, i) => (
              <span
                key={w}
                className={`text-center text-xs ${
                  i === 0 ? "text-destructive" : i === 6 ? "text-secondary" : "text-muted-foreground"
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 lg:gap-2">
            {grid.map((date) => {
              const key = toDateKey(date);
              const inMonth = date.getMonth() + 1 === month;
              const isToday = key === todayKey;
              const dayEvents = eventsByDate.get(key) ?? [];
              const isFlashing = flashDate === key;
              const visibleEvents = dayEvents.slice(0, 2);
              const moreCount = dayEvents.length - visibleEvents.length;

              return (
                <Link
                  key={key}
                  href={`/day/${key}`}
                  className={`flex min-h-[80px] flex-col gap-0.5 overflow-hidden rounded-lg border p-1 text-left transition-shadow lg:min-h-[104px] lg:gap-1 lg:rounded-xl lg:p-1.5 ${
                    isToday
                      ? "border-2 border-primary bg-accent/15"
                      : "border-line"
                  } ${!inMonth ? "opacity-40" : ""} ${
                    isFlashing ? "ring-2 ring-accent animate-pulse" : ""
                  }`}
                >
                  <span
                    className={`text-xs ${
                      isToday
                        ? "font-bold text-primary"
                        : date.getDay() === 0
                          ? "text-destructive"
                          : date.getDay() === 6
                            ? "text-secondary"
                            : "text-foreground"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {visibleEvents.map((ev) => (
                      <span
                        key={ev.id}
                        className={`truncate rounded px-1 py-0.5 text-[10.5px] leading-tight lg:text-[11px] ${ownerChipClass(
                          resolveOwnerLabel(ev, myMemberId),
                        )}`}
                      >
                        {ev.title}
                      </span>
                    ))}
                    {moreCount > 0 && (
                      <span className="px-1 text-[10px] text-muted-foreground lg:text-[11px]">
                        +{moreCount}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <Button
        asChild
        size="icon-lg"
        className="fixed right-5 bottom-[96px] h-14 w-14 text-2xl shadow-lg lg:right-8 lg:bottom-8"
      >
        <Link href={`/events/new?date=${todayKey}`} aria-label="일정 추가">
          +
        </Link>
      </Button>
    </div>
  );
}

import type { Database } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type AnniversaryRow = Database["public"]["Tables"]["anniversaries"]["Row"];

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

// couples.start_date 기준 "만난 지 D+n일"
export function daysSince(startDateKey: string, today = new Date()): number {
  return daysBetween(parseDateKey(startDateKey), today) + 1;
}

// 기념일의 다음 도래 시점(반복이면 올해/내년으로 굴림) 계산
export function nextOccurrence(ann: AnniversaryRow, today = new Date()): Date {
  const base = parseDateKey(ann.ann_date);
  if (!ann.repeat_yearly) return base;
  const candidate = new Date(today.getFullYear(), base.getMonth(), base.getDate());
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (candidate < todayMidnight) candidate.setFullYear(candidate.getFullYear() + 1);
  return candidate;
}

export function ddayLabel(target: Date, today = new Date()): string {
  const diff = daysBetween(today, target);
  if (diff === 0) return "D-day";
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
}

export function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start, end, startKey: toDateKey(start), endKey: toDateKey(end) };
}

// 월간 격자에 표시할 6주(42칸) 날짜 목록 (일요일 시작)
export function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month - 1, 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

function matchesRecurrence(rule: EventRow["repeat_rule"], base: Date, day: Date): boolean {
  return rule === "weekly"
    ? day.getDay() === base.getDay()
    : rule === "monthly"
      ? day.getDate() === base.getDate()
      : rule === "yearly"
        ? day.getDate() === base.getDate() && day.getMonth() === base.getMonth()
        : false;
}

// repeat_rule(weekly/monthly/yearly)과 end_date(연박/여행처럼 여러 날 이어지는 일정)를
// 반영해 이번 달에 실제로 표시될 날짜들로 펼친다.
export function expandEventsForMonth(
  events: EventRow[],
  year: number,
  month: number,
): Map<string, EventRow[]> {
  const { start, end } = monthRange(year, month);
  const byDate = new Map<string, EventRow[]>();

  const push = (key: string, ev: EventRow) => {
    const list = byDate.get(key) ?? [];
    list.push(ev);
    byDate.set(key, list);
  };

  const pushRange = (rangeStart: Date, rangeEnd: Date, ev: EventRow) => {
    const clampedStart = rangeStart < start ? start : rangeStart;
    const clampedEnd = rangeEnd > end ? end : rangeEnd;
    if (clampedStart > clampedEnd) return;
    for (let d = new Date(clampedStart); d <= clampedEnd; d.setDate(d.getDate() + 1)) {
      push(toDateKey(d), ev);
    }
  };

  for (const ev of events) {
    const base = parseDateKey(ev.event_date);
    const rangeEnd = ev.end_date ? parseDateKey(ev.end_date) : base;
    const durationDays = Math.max(0, daysBetween(base, rangeEnd));

    if (ev.repeat_rule === "none") {
      if (rangeEnd >= start && base <= end) pushRange(base, rangeEnd, ev);
      continue;
    }

    // 반복 일정: 범위가 이전 달에서 시작해 이번 달로 이어질 수 있으니
    // durationDays만큼 앞선 날짜부터 앵커(반복 시작일 후보)를 찾는다.
    const searchStart = new Date(start);
    searchStart.setDate(searchStart.getDate() - durationDays);
    const anchorFrom = searchStart < base ? base : searchStart;

    for (let anchor = new Date(anchorFrom); anchor <= end; anchor.setDate(anchor.getDate() + 1)) {
      if (matchesRecurrence(ev.repeat_rule, base, anchor)) {
        const occEnd = new Date(anchor);
        occEnd.setDate(occEnd.getDate() + durationDays);
        pushRange(anchor, occEnd, ev);
      }
    }
  }

  return byDate;
}

// 기념일을 이번 달 격자에 표시할 날짜로 펼친다(매년 반복이면 이번에 보는 연도의 같은 월/일로).
export function expandAnniversariesForMonth(
  anniversaries: AnniversaryRow[],
  year: number,
  month: number,
): Map<string, AnniversaryRow[]> {
  const byDate = new Map<string, AnniversaryRow[]>();
  const push = (key: string, a: AnniversaryRow) => {
    const list = byDate.get(key) ?? [];
    list.push(a);
    byDate.set(key, list);
  };

  for (const a of anniversaries) {
    const base = parseDateKey(a.ann_date);
    if (a.repeat_yearly) {
      if (base.getMonth() === month - 1) {
        push(toDateKey(new Date(year, base.getMonth(), base.getDate())), a);
      }
    } else if (base.getFullYear() === year && base.getMonth() === month - 1) {
      push(a.ann_date, a);
    }
  }

  return byDate;
}

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

// repeat_rule(weekly/monthly/yearly)을 반영해 이번 달에 실제로 표시될 occurrence 날짜들로 펼친다.
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

  for (const ev of events) {
    const base = parseDateKey(ev.event_date);
    if (base > end) continue;

    if (ev.repeat_rule === "none") {
      if (base >= start && base <= end) push(ev.event_date, ev);
      continue;
    }

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d < base) continue;
      const matches =
        ev.repeat_rule === "weekly"
          ? d.getDay() === base.getDay()
          : ev.repeat_rule === "monthly"
            ? d.getDate() === base.getDate()
            : ev.repeat_rule === "yearly"
              ? d.getDate() === base.getDate() && d.getMonth() === base.getMonth()
              : false;
      if (matches) push(toDateKey(d), ev);
    }
  }

  return byDate;
}

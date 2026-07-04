import type { Database } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export type OwnerLabel = "나" | "너" | "우리";

// owner_kind/owner_id는 DB에 그대로 저장하고, "나/너/우리" 라벨은
// 보는 사람(myMemberId) 기준으로 계산한다 — 상대 화면에서 라벨이
// 뒤집히는 걸 막기 위해서다(decisions.md D-002).
export function resolveOwnerLabel(
  event: Pick<EventRow, "owner_kind" | "owner_id">,
  myMemberId: string,
): OwnerLabel {
  if (event.owner_kind === "shared" || !event.owner_id) return "우리";
  return event.owner_id === myMemberId ? "나" : "너";
}

export function ownerColorClass(label: OwnerLabel): string {
  switch (label) {
    case "나":
      return "bg-primary";
    case "너":
      return "bg-secondary";
    case "우리":
      return "bg-accent";
  }
}

export function ownerTextColorClass(label: OwnerLabel): string {
  switch (label) {
    case "나":
      return "text-primary";
    case "너":
      return "text-secondary";
    case "우리":
      return "text-accent";
  }
}

// 월간 격자 칸 안에 일정 제목을 작은 칩으로 보여줄 때 쓰는 배경+글자색 조합.
// 나/너/우리를 뚜렷하게 구분하기 위해 옅은 틴트 대신 채도 높은 -vivid 배경 + 크림 글자를 쓴다.
export function ownerChipClass(label: OwnerLabel): string {
  switch (label) {
    case "나":
      return "bg-main-vivid text-surface font-semibold";
    case "너":
      return "bg-secondary-vivid text-surface font-semibold";
    case "우리":
      return "bg-accent-vivid text-surface font-semibold";
  }
}

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

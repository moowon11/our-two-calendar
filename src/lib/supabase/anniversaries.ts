import { cache } from "react";
import { createClient } from "./server";
import type { Database } from "./types";

type Anniversary = Database["public"]["Tables"]["anniversaries"]["Row"];

// cache()로 감싸서 같은 요청 안에서 레이아웃/day/[date]/anniversaries 페이지가
// 각자 조회하지 않고 couple_id당 한 번만 조회하게 한다.
export const getCoupleAnniversaries = cache(
  async (coupleId: string): Promise<Anniversary[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anniversaries")
      .select("*")
      .eq("couple_id", coupleId);

    if (error) throw new Error("anniversaries-load-failed");
    return data;
  },
);

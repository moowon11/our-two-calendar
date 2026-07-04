import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { nextOccurrence, ddayLabel } from "@/lib/date-utils";
import { AddAnniversaryForm } from "./add-form";
import { AnniversaryItem } from "./anniversary-item";

export default async function AnniversariesPage() {
  const session = await getSessionInfo();
  if (session.status !== "connected") redirect("/login");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anniversaries")
    .select("*")
    .eq("couple_id", session.couple.id);

  if (error) throw new Error("anniversaries-load-failed");

  const items = data
    .map((a) => ({ a, next: nextOccurrence(a) }))
    .sort((x, y) => x.next.getTime() - y.next.getTime());

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-hand text-3xl font-bold text-foreground">기념일 · 디데이</h1>

      <AddAnniversaryForm />

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-accent bg-card px-5 py-10 text-center">
          <span className="text-3xl">🎁</span>
          <p className="font-hand text-lg font-bold text-foreground">
            아직 기념일이 없어. 첫 기념일을 남겨볼까?
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(({ a, next }) => (
            <AnniversaryItem key={a.id} anniversary={a} dday={ddayLabel(next)} />
          ))}
        </ul>
      )}
    </div>
  );
}

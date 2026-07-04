import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { toDateKey } from "@/lib/date-utils";
import { EventForm } from "../event-form";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSessionInfo();
  if (session.status !== "connected") redirect("/login");
  const { date } = await searchParams;

  return (
    <EventForm
      mode="new"
      defaultDate={date ?? toDateKey(new Date())}
      myMemberId={session.member.id}
      meName={session.member.display_name || "나"}
      partnerName={session.partner?.display_name || "상대"}
    />
  );
}

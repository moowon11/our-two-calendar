import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage() {
  const session = await getSessionInfo();
  if (session.status !== "connected") redirect("/login");

  const { member, couple, partner } = session;

  return (
    <CalendarClient
      coupleId={couple.id}
      startDate={couple.start_date}
      myMemberId={member.id}
      meColor={member.color}
      partnerColor={partner?.color ?? "#A7B99A"}
    />
  );
}

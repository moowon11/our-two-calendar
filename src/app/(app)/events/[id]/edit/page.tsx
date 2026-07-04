import { notFound, redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "../../event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionInfo();
  if (session.status !== "connected") redirect("/login");
  const { id } = await params;

  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();

  return (
    <EventForm
      mode="edit"
      initialEvent={event}
      defaultDate={event.event_date}
      myMemberId={session.member.id}
      meName={session.member.display_name || "나"}
      partnerName={session.partner?.display_name || "상대"}
    />
  );
}

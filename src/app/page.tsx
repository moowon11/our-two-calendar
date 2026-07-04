import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";

export default async function Home() {
  const session = await getSessionInfo();

  if (session.status === "unauthenticated") redirect("/login");
  if (session.status === "no-couple") redirect("/connect");
  redirect("/calendar");
}

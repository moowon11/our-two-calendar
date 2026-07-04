import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { AuthCard } from "@/components/auth-card";
import { SignUpForm } from "./signup-form";

export default async function SignUpPage() {
  const session = await getSessionInfo();
  if (session.status === "connected") redirect("/calendar");
  if (session.status === "no-couple") redirect("/connect");

  return (
    <AuthCard>
      <h1 className="text-center font-hand text-3xl font-bold text-foreground">
        반가워, 이름 알려줄래?
      </h1>

      <SignUpForm />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        이미 있어?{" "}
        <Link href="/login" className="font-bold text-primary">
          로그인
        </Link>
      </p>
    </AuthCard>
  );
}

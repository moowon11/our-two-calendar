import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSessionInfo();
  if (session.status === "connected") redirect("/calendar");
  if (session.status === "no-couple") redirect("/connect");

  return (
    <AuthCard>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-hand text-4xl font-bold text-foreground">
          우리 달력
        </h1>
        <p className="text-sm text-muted-foreground">
          오늘도 너랑 나랑, 여기서 만나자
        </p>
      </div>

      <LoginForm />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        처음이야?{" "}
        <Link href="/signup" className="font-bold text-primary">
          회원가입
        </Link>
      </p>
    </AuthCard>
  );
}

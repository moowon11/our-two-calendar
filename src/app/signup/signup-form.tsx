"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signUpAction, type SignUpActionState } from "./actions";

const initialState: SignUpActionState = { error: null, needsEmailConfirm: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="mt-2 h-12 w-full font-hand text-xl font-bold"
    >
      {pending ? "가입하는 중..." : "가입하고 시작하기"}
    </Button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, initialState);

  if (state.needsEmailConfirm) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        <span className="text-4xl">📮</span>
        <p className="font-hand text-2xl font-bold text-foreground">
          이메일함을 확인해줘
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          보내준 확인 메일의 링크를 눌러야 로그인할 수 있어. 확인했으면 로그인 화면으로
          돌아가줘.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3.5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">닉네임</Label>
        <Input id="displayName" name="displayName" type="text" required maxLength={20} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <SubmitButton />
    </form>
  );
}

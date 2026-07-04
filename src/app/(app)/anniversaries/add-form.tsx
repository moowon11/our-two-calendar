"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createAnniversaryAction, type AnniversaryActionState } from "./actions";

const initialState: AnniversaryActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-12 font-hand text-lg font-bold">
      {pending ? "추가하는 중..." : "+ 기념일 추가"}
    </Button>
  );
}

export function AddAnniversaryForm() {
  const [state, formAction] = useActionState(createAnniversaryAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5"
    >
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ann-title">기념일 이름</Label>
        <Input
          id="ann-title"
          name="title"
          placeholder="예: 준 생일, 100일"
          required
          maxLength={60}
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ann-date">날짜</Label>
        <Input id="ann-date" name="ann_date" type="date" required className="h-12 text-base" />
      </div>

      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <input type="checkbox" name="repeat_yearly" defaultChecked className="size-4 accent-primary" />
        매년 반복
      </label>

      <SubmitButton />
    </form>
  );
}

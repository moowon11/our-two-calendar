"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createAnniversaryAction, type AnniversaryActionState } from "./actions";

const initialState: AnniversaryActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="shrink-0">
      {pending ? "추가하는 중..." : "+ 추가"}
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
      className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4"
    >
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="title"
          aria-label="기념일 이름"
          placeholder="기념일 이름"
          required
          maxLength={60}
          className="flex-1"
        />
        <Input name="ann_date" type="date" aria-label="기념일 날짜" required />
        <SubmitButton />
      </div>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input type="checkbox" name="repeat_yearly" defaultChecked className="accent-primary" />
        매년 반복
      </label>
    </form>
  );
}

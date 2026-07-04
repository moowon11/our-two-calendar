"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateNicknameAction, type NicknameActionState } from "./nickname-actions";

const initialState: NicknameActionState = { error: null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="shrink-0">
      {pending ? "저장 중..." : "저장"}
    </Button>
  );
}

export function NicknameForm({ initialName }: { initialName: string }) {
  const [state, formAction] = useActionState(updateNicknameAction, initialState);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (state.success) {
      setSavedFlash(true);
      const t = setTimeout(() => setSavedFlash(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <Label htmlFor="displayName">내 닉네임</Label>
      <div className="flex gap-2">
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initialName}
          maxLength={20}
          required
          className="flex-1"
        />
        <SaveButton />
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {savedFlash && !state.error && <p className="text-xs text-success">저장했어</p>}
    </form>
  );
}

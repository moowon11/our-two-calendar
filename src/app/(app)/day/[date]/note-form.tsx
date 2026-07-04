"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { saveNoteAction, type NoteActionState } from "./actions";

const initialState: NoteActionState = { error: null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "저장 중..." : "저장"}
    </Button>
  );
}

export function NoteForm({
  date,
  initialContent,
}: {
  date: string;
  initialContent: string;
}) {
  const [state, formAction] = useActionState(saveNoteAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="date" value={date} />
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Textarea
          name="content"
          defaultValue={initialContent}
          placeholder="오늘 하루 한 줄 남겨볼까?"
          maxLength={280}
          className="min-h-[44px] flex-1"
        />
        <SaveButton />
      </div>
    </form>
  );
}

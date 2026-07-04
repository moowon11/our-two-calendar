"use client";

import { useActionState, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Database } from "@/lib/supabase/types";
import {
  updateAnniversaryAction,
  deleteAnniversaryAction,
  toggleAnniversaryFieldAction,
  type AnniversaryActionState,
} from "./actions";

type AnniversaryRow = Database["public"]["Tables"]["anniversaries"]["Row"];

const initialState: AnniversaryActionState = { error: null };

export function AnniversaryItem({
  anniversary,
  dday,
}: {
  anniversary: AnniversaryRow;
  dday: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(updateAnniversaryAction, initialState);
  const [isDeleting, startDelete] = useTransition();
  const [isToggling, startToggle] = useTransition();

  if (editing) {
    return (
      <li className="rounded-2xl border border-line bg-card p-5">
        <form
          action={(fd) => {
            formAction(fd);
            if (!state.error) setEditing(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="id" value={anniversary.id} />
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`ann-title-${anniversary.id}`}>기념일 이름</Label>
            <Input
              id={`ann-title-${anniversary.id}`}
              name="title"
              defaultValue={anniversary.title}
              required
              maxLength={60}
              className="h-12 text-base"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`ann-date-${anniversary.id}`}>날짜</Label>
            <Input
              id={`ann-date-${anniversary.id}`}
              name="ann_date"
              type="date"
              defaultValue={anniversary.ann_date}
              required
              className="h-12 text-base"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "저장 중..." : "저장"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)} className="flex-1">
              취소
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-hand text-xl font-bold text-foreground">
            {anniversary.title}
          </span>
          <span className="text-xs text-muted-foreground">{anniversary.ann_date}</span>
        </div>
        <span className="rounded-full bg-accent/25 px-3 py-1 font-hand text-lg font-bold text-primary">
          {dday}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <label className="flex items-center gap-1.5">
          매년 반복
          <Switch
            size="sm"
            checked={anniversary.repeat_yearly}
            disabled={isToggling}
            onCheckedChange={(checked) =>
              startToggle(() =>
                toggleAnniversaryFieldAction(anniversary.id, "repeat_yearly", checked),
              )
            }
          />
        </label>
        <label className="flex items-center gap-1.5">
          위젯 고정
          <Switch
            size="sm"
            checked={anniversary.pinned_to_widget}
            disabled={isToggling}
            onCheckedChange={(checked) =>
              startToggle(() =>
                toggleAnniversaryFieldAction(anniversary.id, "pinned_to_widget", checked),
              )
            }
          />
        </label>
        <div className="ml-auto flex gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-foreground">
            수정
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => startDelete(() => deleteAnniversaryAction(anniversary.id))}
            className="text-destructive"
          >
            삭제
          </button>
        </div>
      </div>
    </li>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveEventAction,
  deleteEventAction,
  uploadEventPhotoAction,
  type EventActionState,
} from "./actions";
import { resizeImageForUpload } from "@/lib/image-resize";
import type { Database } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

const initialState: EventActionState = { error: null, eventId: null, date: null };

function ownerFromEvent(ev: EventRow | undefined, myId: string): "me" | "partner" | "shared" {
  if (!ev || ev.owner_kind === "shared" || !ev.owner_id) return "shared";
  return ev.owner_id === myId ? "me" : "partner";
}

export function EventForm({
  mode,
  initialEvent,
  defaultDate,
  myMemberId,
  meName,
  partnerName,
}: {
  mode: "new" | "edit";
  initialEvent?: EventRow;
  defaultDate: string;
  myMemberId: string;
  meName: string;
  partnerName: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(saveEventAction, initialState);
  const wasPending = useRef(false);
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isUploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMultiDay, setIsMultiDay] = useState(!!initialEvent?.end_date);
  const [startDateValue, setStartDateValue] = useState(
    initialEvent?.event_date ?? defaultDate,
  );
  const [isAllDay, setIsAllDay] = useState(
    initialEvent ? !initialEvent.start_time && !initialEvent.end_time : false,
  );

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setSaved(true);
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !state.eventId || !state.date) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const resized = await resizeImageForUpload(file);
      const formData = new FormData();
      formData.set("eventId", state.eventId);
      formData.set("date", state.date);
      formData.set("file", resized);
      const result = await uploadEventPhotoAction({ error: null }, formData);
      if (result.error) setPhotoError(result.error);
    } catch {
      setPhotoError("사진을 처리하지 못했어");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (saved) {
    const targetDate = state.date ?? defaultDate;
    return (
      <div className="flex flex-col items-center gap-5 px-5 py-10 text-center">
        <span className="text-6xl">💗</span>
        <p className="font-hand text-2xl font-bold text-foreground">
          {mode === "new" ? "일정을 남겼어" : "수정했어"}
        </p>

        <div className="flex w-full max-w-xs flex-col gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
          {photoError && <p className="text-xs text-destructive">{photoError}</p>}
          <Button
            type="button"
            variant="secondary"
            disabled={isUploadingPhoto}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploadingPhoto ? "올리는 중..." : "+ 사진 첨부하기"}
          </Button>
          <Button onClick={() => router.push(`/day/${targetDate}`)}>그 날짜 보기</Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="mx-auto flex max-w-lg flex-col gap-4 px-5 py-6 lg:px-8 lg:py-8">
      {initialEvent && <input type="hidden" name="id" value={initialEvent.id} />}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <h1 className="font-hand text-2xl font-bold text-foreground">
        {mode === "new" ? "새 일정" : "일정 수정"}
      </h1>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={80}
          defaultValue={initialEvent?.title}
          placeholder="무슨 일이야?"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event_date">{isMultiDay ? "시작 날짜" : "날짜"}</Label>
        <Input
          id="event_date"
          name="event_date"
          type="date"
          required
          defaultValue={initialEvent?.event_date ?? defaultDate}
          onChange={(e) => setStartDateValue(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={isMultiDay}
          onChange={(e) => setIsMultiDay(e.target.checked)}
          className="size-4 accent-primary"
        />
        여행처럼 여러 날에 걸쳐요(연박)
      </label>

      {isMultiDay && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end_date">종료 날짜</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            required={isMultiDay}
            min={startDateValue}
            defaultValue={initialEvent?.end_date ?? undefined}
          />
        </div>
      )}

      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={isAllDay}
          onChange={(e) => setIsAllDay(e.target.checked)}
          className="size-4 accent-primary"
        />
        하루 종일(시간 없음)
      </label>

      {!isAllDay && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="start_time">시작 시간</Label>
            <Input
              id="start_time"
              name="start_time"
              type="time"
              defaultValue={initialEvent?.start_time?.slice(0, 5)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="end_time">종료 시간</Label>
            <Input
              id="end_time"
              name="end_time"
              type="time"
              defaultValue={initialEvent?.end_time?.slice(0, 5)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="owner">주인</Label>
        <Select name="owner" defaultValue={ownerFromEvent(initialEvent, myMemberId)}>
          <SelectTrigger id="owner" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="me">나 ({meName})</SelectItem>
            <SelectItem value="partner">너 ({partnerName})</SelectItem>
            <SelectItem value="shared">우리</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="repeat_rule">반복</Label>
        <Select name="repeat_rule" defaultValue={initialEvent?.repeat_rule ?? "none"}>
          <SelectTrigger id="repeat_rule" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">반복 안 함</SelectItem>
            <SelectItem value="weekly">매주</SelectItem>
            <SelectItem value="monthly">매월</SelectItem>
            <SelectItem value="yearly">매년</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="memo">메모</Label>
        <Textarea
          id="memo"
          name="memo"
          maxLength={500}
          defaultValue={initialEvent?.memo ?? ""}
          placeholder="같이 남기고 싶은 말이 있어?"
        />
      </div>

      <Button type="submit" disabled={isPending} className="h-12 font-hand text-xl font-bold">
        {isPending ? "저장하는 중..." : mode === "new" ? "일정 남기기" : "저장하기"}
      </Button>

      {mode === "edit" && initialEvent && (
        <Button
          type="button"
          variant="destructive"
          onClick={() =>
            deleteEventAction(initialEvent.id, initialEvent.event_date).then(() =>
              router.push(`/day/${initialEvent.event_date}`),
            )
          }
        >
          일정 삭제
        </Button>
      )}
    </form>
  );
}

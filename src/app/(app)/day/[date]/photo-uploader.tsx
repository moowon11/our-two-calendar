"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resizeImageForUpload } from "@/lib/image-resize";
import { uploadPhotoAction } from "./actions";

export function PhotoUploader({ date }: { date: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    try {
      const resized = await resizeImageForUpload(file);
      const formData = new FormData();
      formData.set("date", date);
      formData.set("file", resized);
      startTransition(async () => {
        const result = await uploadPhotoAction({ error: null }, formData);
        if (result.error) setError(result.error);
      });
    } catch {
      setError("사진을 처리하지 못했어");
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        className="w-fit"
      >
        {isPending ? "올리는 중..." : "+ 사진 추가"}
      </Button>
    </div>
  );
}

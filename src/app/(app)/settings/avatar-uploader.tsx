"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { resizeImageForUpload } from "@/lib/image-resize";
import { uploadAvatarAction, removeAvatarAction } from "./avatar-actions";

export function AvatarUploader({
  color,
  name,
  avatarUrl,
}: {
  color: string;
  name: string;
  avatarUrl: string | null;
}) {
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
      formData.set("file", resized);
      startTransition(async () => {
        const result = await uploadAvatarAction({ error: null }, formData);
        if (result.error) setError(result.error);
      });
    } catch {
      setError("사진을 처리하지 못했어");
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-card p-5">
      <MemberAvatar url={avatarUrl} color={color} name={name} className="h-16 w-16 text-2xl" />
      <div className="flex flex-1 flex-col gap-1.5">
        <p className="text-sm text-foreground">프로필 사진</p>
        <p className="text-xs text-muted-foreground">
          안 올리면 동그라미 안에 이름 첫 글자가 대신 나와.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            {isPending ? "올리는 중..." : avatarUrl ? "사진 바꾸기" : "사진 올리기"}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => startTransition(() => removeAvatarAction())}
            >
              제거
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

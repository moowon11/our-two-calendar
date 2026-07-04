"use client";

import { useTransition } from "react";
import { deletePhotoAction } from "./actions";

export function DeletePhotoButton({
  photoId,
  storagePath,
  date,
}: {
  photoId: string;
  storagePath: string;
  date: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="사진 삭제"
      disabled={isPending}
      onClick={() => startTransition(() => deletePhotoAction(photoId, storagePath, date))}
      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
    >
      ✕
    </button>
  );
}

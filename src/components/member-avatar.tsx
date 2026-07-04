"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function AvatarVisual({
  url,
  color,
  name,
  className,
}: {
  url?: string | null;
  color: string;
  name: string;
  className: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className={`rounded-full object-cover ${className}`} />
    );
  }
  const initial = name.trim().charAt(0) || "?";
  return (
    <span
      className={`flex items-center justify-center rounded-full font-hand font-bold text-surface ${className}`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </span>
  );
}

export function MemberAvatar({
  url,
  color,
  name,
  className = "h-9 w-9 text-sm",
}: {
  url?: string | null;
  color: string;
  name: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${name} 프로필 사진 크게 보기`}
        className="shrink-0 appearance-none border-0 bg-transparent p-0"
      >
        <AvatarVisual url={url} color={color} name={name} className={className} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col items-center gap-3 sm:max-w-xs">
          <DialogTitle className="sr-only">{name} 프로필 사진</DialogTitle>
          <AvatarVisual
            url={url}
            color={color}
            name={name}
            className="h-56 w-56 text-6xl"
          />
          <span className="font-hand text-xl font-bold text-foreground">{name}</span>
        </DialogContent>
      </Dialog>
    </>
  );
}

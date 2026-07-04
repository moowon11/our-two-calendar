"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { unlinkCoupleAction } from "@/lib/supabase/actions";

export function UnlinkCoupleButton({ partnerName }: { partnerName: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await unlinkCoupleAction();
      if (result?.error) setError(result.error);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          커플 끊기
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-hand text-xl">
            {partnerName}와 연결을 끊을까?
          </DialogTitle>
          <DialogDescription>
            연결이 끊어지면 서로의 달력·추억·쪽지를 더 이상 볼 수 없어. 지금까지 쌓은
            기록은 지워지지 않으니, 같은 초대코드로 다시 연결하면 그대로 돌아와.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "끊는 중..." : "끊기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

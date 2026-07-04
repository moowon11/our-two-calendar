"use client";

import { Button } from "@/components/ui/button";

export default function AnniversariesError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-4xl">😢</span>
      <p className="text-foreground">기념일을 불러오지 못했어</p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}

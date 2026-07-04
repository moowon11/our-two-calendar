"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 64;
const MAX_PULL = 110;

// 터치 시작 지점에서 가장 가까운 스크롤 가능한 조상을 찾아 "맨 위"인지 확인한다.
// (메시지 화면처럼 안쪽 div가 따로 스크롤되는 경우, 그 div가 맨 위일 때만 당겨서 새로고침을 허용)
function isScrollAtTop(target: EventTarget | null, boundary: HTMLElement): boolean {
  let el = target instanceof HTMLElement ? target : null;
  while (el && el !== boundary.parentElement) {
    const style = window.getComputedStyle(el);
    const scrollable = /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight;
    if (scrollable) return el.scrollTop <= 0;
    el = el.parentElement;
  }
  return window.scrollY <= 0;
}

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (!isRefreshing && isScrollAtTop(e.target, el)) {
        startY.current = e.touches[0].clientY;
      } else {
        startY.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || isRefreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }
      // 화면(또는 스크롤 영역) 맨 위에서 아래로 당길 때만 반응하고, 저항감을 줘서 자연스럽게 늘어지도록.
      e.preventDefault();
      setPullDistance(Math.min(MAX_PULL, delta * 0.45));
    };

    const onTouchEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullDistance >= THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(THRESHOLD);
        window.location.reload();
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance, isRefreshing]);

  const progress = Math.min(1, pullDistance / THRESHOLD);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden transition-[height] duration-150 lg:hidden"
        style={{ height: pullDistance }}
      >
        <div
          className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-card text-lg shadow-md"
          style={{
            opacity: progress,
            transform: `scale(${0.6 + progress * 0.4}) rotate(${progress * 180}deg)`,
          }}
        >
          {isRefreshing ? "⏳" : "🔄"}
        </div>
      </div>
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? "transform 150ms" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "./client";

export function useRealtimeTable<T extends Record<string, unknown>>(
  table: string,
  filter: string | undefined,
  onChange: (payload: RealtimePostgresChangesPayload<T>) => void,
) {
  const callbackRef = useRef(onChange);
  useEffect(() => {
    callbackRef.current = onChange;
  });

  // createClient()는 브라우저에서 싱글턴을 반환하고, supabase-js의 channel(topic)은
  // 같은 topic 문자열이면 새로 만들지 않고 "이미 구독 중인" 채널 객체를 그대로 돌려준다.
  // 그래서 같은 table+filter로 훅을 쓰는 컴포넌트가 두 개 이상 동시에 마운트되면
  // (예: 데스크톱 사이드바 + 모바일 하단 탭이 둘 다 렌더될 때) 두 번째 컴포넌트가
  // 이미 subscribe() 된 채널에 .on()을 걸다가 "cannot add ... after subscribe()" 에러가 난다.
  // useId로 컴포넌트 인스턴스마다 topic을 다르게 만들어 채널을 절대 공유하지 않게 한다.
  const instanceId = useId();

  useEffect(() => {
    const supabase = createClient();
    const channelName = `${table}-${filter ?? "all"}-${instanceId}`;
    const channel = supabase.channel(channelName);
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        (payload) => callbackRef.current(payload as RealtimePostgresChangesPayload<T>),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, instanceId]);
}

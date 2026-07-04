"use client";

import { useEffect, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "./client";

export function useRealtimeTable<T extends Record<string, unknown>>(
  table: string,
  filter: string | undefined,
  onChange: (payload: RealtimePostgresChangesPayload<T>) => void,
) {
  const callbackRef = useRef(onChange);
  callbackRef.current = onChange;

  useEffect(() => {
    const supabase = createClient();
    const channelName = `${table}-${filter ?? "all"}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        (payload) => callbackRef.current(payload as RealtimePostgresChangesPayload<T>),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter]);
}

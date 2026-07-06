import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

// photos 버킷 안에 커플 폴더 규칙을 그대로 따르는 아바타 경로 — 별도 버킷/정책 없이 기존 storage RLS를 재사용한다.
export function avatarStoragePath(coupleId: string, memberId: string): string {
  return `${coupleId}/avatars/${memberId}.webp`;
}

// cache()로 감싸서 같은 요청 안에서 같은 경로를 여러 화면(레이아웃+페이지)이 각자
// 서명하지 않고 한 번만 서명하게 한다. server.ts의 createClient()도 cache()로 감싸져
// 있어서 인자로 들어오는 supabase 인스턴스가 요청 내내 동일하므로 캐시 키가 맞는다.
export const signAvatarUrl = cache(async function signAvatarUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
});

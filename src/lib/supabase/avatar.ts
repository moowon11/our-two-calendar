import type { SupabaseClient } from "@supabase/supabase-js";

// photos 버킷 안에 커플 폴더 규칙을 그대로 따르는 아바타 경로 — 별도 버킷/정책 없이 기존 storage RLS를 재사용한다.
export function avatarStoragePath(coupleId: string, memberId: string): string {
  return `${coupleId}/avatars/${memberId}.webp`;
}

export async function signAvatarUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

// cache()로 감싸서 같은 요청 안에서는 항상 같은 클라이언트 인스턴스를 재사용한다.
// (레이아웃/페이지가 각자 createClient()를 불러도 signAvatarUrl 같은 캐시 함수의
// 인자 아이덴티티가 요청마다 일치하게 하기 위함 — 쿠키만 읽고 네트워크 호출은 없어 안전.)
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 호출된 경우 — 세션 갱신은 미들웨어가 담당하므로 무시해도 된다.
          }
        },
      },
    },
  );
});

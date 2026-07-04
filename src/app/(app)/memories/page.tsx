import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";

const MAX_PHOTOS = 300;

export default async function MemoriesPage() {
  const session = await getSessionInfo();
  if (session.status !== "connected") redirect("/login");

  const supabase = await createClient();
  const { data: photos, error } = await supabase
    .from("photos")
    .select("*")
    .eq("couple_id", session.couple.id)
    .order("photo_date", { ascending: false })
    .limit(MAX_PHOTOS);

  if (error) throw new Error("memories-load-failed");

  if (photos.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">
        <h1 className="font-hand text-3xl font-bold text-foreground">추억 모아보기</h1>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-accent bg-card px-5 py-14 text-center">
          <span className="text-4xl">🖼️</span>
          <p className="font-hand text-lg font-bold text-foreground">
            아직 추억이 없어. 첫 사진을 남겨볼까?
          </p>
        </div>
      </div>
    );
  }

  const { data: signed } = await supabase.storage
    .from("photos")
    .createSignedUrls(
      photos.map((p) => p.storage_path),
      3600,
    );
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl] as const));

  const groups = new Map<string, typeof photos>();
  for (const p of photos) {
    const key = p.photo_date.slice(0, 7);
    const list = groups.get(key) ?? [];
    list.push(p);
    groups.set(key, list);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-hand text-3xl font-bold text-foreground">추억 모아보기</h1>

      {Array.from(groups.entries()).map(([month, monthPhotos]) => (
        <section key={month} className="flex flex-col gap-2.5">
          <h2 className="font-hand text-xl font-bold text-muted-foreground">
            {month.slice(0, 4)}년 {Number(month.slice(5, 7))}월
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {monthPhotos.map((p) => {
              const url = urlByPath.get(p.storage_path);
              if (!url) return null;
              return (
                <Link
                  key={p.id}
                  href={`/day/${p.photo_date}`}
                  className="aspect-square overflow-hidden rounded-xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

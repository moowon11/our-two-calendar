import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionInfo } from "@/lib/supabase/session";
import {
  ddayLabel,
  expandAnniversariesForMonth,
  expandEventsForMonth,
  parseDateKey,
} from "@/lib/date-utils";
import { resolveOwnerLabel, ownerColorClass } from "@/lib/owner-label";
import { Button } from "@/components/ui/button";
import { NoteForm } from "./note-form";
import { PhotoUploader } from "./photo-uploader";
import { DeletePhotoButton } from "./delete-photo-button";

export default async function DayDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const session = await getSessionInfo();
  if (session.status !== "connected") redirect("/login");
  const { member, couple, partner } = session;

  const supabase = await createClient();
  const d = parseDateKey(date);

  const [eventsRes, notesRes, photosRes, annRes] = await Promise.all([
    supabase.from("events").select("*").eq("couple_id", couple.id),
    supabase
      .from("notes")
      .select("*")
      .eq("couple_id", couple.id)
      .eq("note_date", date)
      .order("created_at"),
    supabase
      .from("photos")
      .select("*")
      .eq("couple_id", couple.id)
      .eq("photo_date", date)
      .order("created_at"),
    supabase.from("anniversaries").select("*").eq("couple_id", couple.id),
  ]);

  if (eventsRes.error || notesRes.error || photosRes.error || annRes.error) {
    throw new Error("day-detail-load-failed");
  }

  const dayEvents =
    expandEventsForMonth(eventsRes.data, d.getFullYear(), d.getMonth() + 1).get(date) ?? [];
  const dayAnniversaries =
    expandAnniversariesForMonth(annRes.data, d.getFullYear(), d.getMonth() + 1).get(date) ?? [];
  const notes = notesRes.data;
  const photos = photosRes.data;
  const myNote = notes.find((n) => n.author_id === member.id);

  let signedUrls: { path: string; url: string }[] = [];
  if (photos.length > 0) {
    const { data: signed } = await supabase.storage
      .from("photos")
      .createSignedUrls(
        photos.map((p) => p.storage_path),
        3600,
      );
    signedUrls = (signed ?? [])
      .filter((s) => s.signedUrl)
      .map((s) => ({ path: s.path!, url: s.signedUrl! }));
  }
  const urlByPath = new Map(signedUrls.map((s) => [s.path, s.url]));

  const nameById = (id: string) =>
    id === member.id ? member.display_name || "나" : partner?.display_name || "상대";

  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const isEmpty =
    dayEvents.length === 0 &&
    dayAnniversaries.length === 0 &&
    notes.length === 0 &&
    photos.length === 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-3">
        <Link
          href="/calendar"
          aria-label="달력으로"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted-foreground"
        >
          ‹
        </Link>
        <h1 className="font-hand text-2xl font-bold text-foreground lg:text-3xl">
          {d.getFullYear()}년 {d.getMonth() + 1}월 {d.getDate()}일 ({weekday})
        </h1>
      </div>

      {isEmpty && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-accent bg-card px-5 py-8 text-center">
          <span className="text-3xl">🌿</span>
          <p className="font-hand text-lg font-bold text-foreground">
            이 날은 아직 조용하네
          </p>
        </div>
      )}

      {/* 기념일 */}
      {dayAnniversaries.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-bold text-muted-foreground">기념일</h2>
          <ul className="flex flex-col gap-2">
            {dayAnniversaries.map((a) => (
              <li key={a.id}>
                <Link
                  href="/anniversaries"
                  className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3"
                >
                  <span className="text-lg">🎉</span>
                  <span className="flex-1 font-hand text-base font-bold text-foreground">
                    {a.title}
                  </span>
                  <span className="rounded-full bg-anniversary/15 px-2.5 py-1 font-hand text-sm font-bold text-anniversary">
                    {ddayLabel(d)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 일정 */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-muted-foreground">일정</h2>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/events/new?date=${date}`}>+ 일정 추가</Link>
          </Button>
        </div>
        {dayEvents.length > 0 && (
          <ul className="flex flex-col gap-2">
            {dayEvents.map((ev) => {
              const label = resolveOwnerLabel(ev, member.id);
              return (
                <li key={ev.id}>
                  <Link
                    href={`/events/${ev.id}/edit`}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3"
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ownerColorClass(label)}`} />
                    <div className="flex flex-1 flex-col">
                      <span className="flex items-center gap-1.5 text-sm text-foreground">
                        {ev.title}
                        {ev.end_date && ev.end_date !== ev.event_date && (
                          <span className="rounded-full bg-accent/25 px-1.5 py-0.5 text-[10px] text-accent-deep">
                            {ev.event_date.slice(5)} ~ {ev.end_date.slice(5)}
                          </span>
                        )}
                      </span>
                      {ev.start_time ? (
                        <span className="text-xs text-muted-foreground">
                          {ev.start_time.slice(0, 5)}
                          {ev.end_time ? ` - ${ev.end_time.slice(0, 5)}` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">종일</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 한 줄 메모 */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-bold text-muted-foreground">한 줄 메모</h2>
        {notes
          .filter((n) => n.author_id !== member.id)
          .map((n) => (
            <div key={n.id} className="rounded-2xl bg-muted px-4 py-3 text-sm text-foreground">
              <span className="mr-2 text-xs font-bold text-secondary">
                {nameById(n.author_id)}
              </span>
              {n.content}
            </div>
          ))}
        <NoteForm date={date} initialContent={myNote?.content ?? ""} />
      </section>

      {/* 사진 */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-bold text-muted-foreground">사진</h2>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => {
              const url = urlByPath.get(p.storage_path);
              if (!url) return null;
              return (
                <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <DeletePhotoButton photoId={p.id} storagePath={p.storage_path} date={date} />
                </div>
              );
            })}
          </div>
        )}
        <PhotoUploader date={date} />
      </section>
    </div>
  );
}

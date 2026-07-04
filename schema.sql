-- =====================================================================
-- schema.sql — 우리 둘의 캘린더 / Supabase 전체 설정 (한 번에 실행)
-- 실행 위치: Supabase 대시보드 > SQL Editor > 새 쿼리에 전체 붙여넣기 > Run
-- 포함: 확장 / 테이블 / 인덱스 / updated_at·user_id 트리거 / RLS 정책
--       / 커플 생성·참여 RPC / Storage 버킷·정책 / Realtime publication
-- 접근 제어 축: "내가 속한 커플(couple_id)의 행만" 볼 수 있다.
-- 모든 테이블은 user_id(생성자 auth uid)를 가진다(요구사항).
-- =====================================================================

-- 0) 확장 -------------------------------------------------------------
create extension if not exists "pgcrypto";     -- gen_random_uuid()

-- =====================================================================
-- 1) 공통 함수: updated_at 자동 갱신 / user_id 자동 세팅 / 커플 조회
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

-- insert 시 user_id 가 비어 있으면 현재 로그인 사용자로 채운다.
create or replace function public.set_user_id()
returns trigger language plpgsql as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end; $$;

-- =====================================================================
-- 2) 테이블
-- =====================================================================

-- 2-1) 커플(둘의 공간)
create table if not exists public.couples (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,  -- 생성자
  invite_code text not null unique,
  start_date  date,                                   -- 사귄 날(디데이 기준)
  theme       text not null default 'cream',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2-2) 멤버(사용자) : id = auth.users.id
create table if not exists public.members (
  id           uuid primary key references auth.users(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,  -- = id
  couple_id    uuid references public.couples(id) on delete set null,
  display_name text not null default '',
  color        text not null default '#E8927C',       -- 기본 코랄
  role         text check (role in ('a','b')),        -- a=먼저 만든 사람
  avatar_url   text,                                  -- photos 버킷 안 경로(<couple_id>/avatars/<member_id>.webp). null이면 이니셜 아바타로 표시
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- 이미 만들어진 프로젝트에 컬럼만 추가할 때(테이블은 그대로 두고):
alter table public.members add column if not exists avatar_url text;

-- 2-3) 일정
--   owner_kind: 'individual'(개인 일정) | 'shared'(둘의 일정)
--   owner_id  : 개인 일정일 때 그 멤버. 화면에서 로그인 멤버와 비교해 나/너/우리로 렌더.
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  couple_id   uuid not null references public.couples(id) on delete cascade,
  title       text not null,
  event_date  date not null,
  end_date    date,                                   -- 연박/여행처럼 여러 날에 걸치면 마지막 날짜(포함). null이면 하루짜리.
  start_time  time,
  end_time    time,
  owner_kind  text not null default 'individual' check (owner_kind in ('individual','shared')),
  owner_id    uuid references public.members(id) on delete set null,
  memo        text,
  repeat_rule text not null default 'none' check (repeat_rule in ('none','weekly','monthly','yearly')),
  updated_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint events_end_date_after_start check (end_date is null or end_date >= event_date)
);
-- 이미 만들어진 프로젝트에 컬럼만 추가할 때(테이블은 그대로 두고):
alter table public.events add column if not exists end_date date;
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_end_date_after_start'
  ) then
    alter table public.events
      add constraint events_end_date_after_start check (end_date is null or end_date >= event_date);
  end if;
end $$;

-- 2-4) 기념일 · 디데이
create table if not exists public.anniversaries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  couple_id        uuid not null references public.couples(id) on delete cascade,
  title            text not null,
  ann_date         date not null,
  repeat_yearly    boolean not null default true,
  pinned_to_widget boolean not null default false,
  updated_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 2-5) 날짜 기록 / 한 줄 일기
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  couple_id  uuid not null references public.couples(id) on delete cascade,
  note_date  date not null,
  content    text not null default '',
  author_id  uuid not null references public.members(id) on delete cascade,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2-6) 쪽지
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  couple_id  uuid not null references public.couples(id) on delete cascade,
  content    text not null,
  from_id    uuid not null references public.members(id) on delete cascade,
  to_id      uuid not null references public.members(id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- 2-7) 사진 (원본은 Storage, 여기엔 메타)
create table if not exists public.photos (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  couple_id        uuid not null references public.couples(id) on delete cascade,
  storage_path     text not null,                    -- 예: <couple_id>/2026/07/uuid.webp
  caption          text,
  photo_date       date not null,
  attached_to_type text check (attached_to_type in ('event','note','date')),
  attached_to_id   uuid,                             -- event/note id (date면 null)
  created_at       timestamptz not null default now()
);

-- 현재 로그인 사용자가 속한 커플 id (RLS 정책의 핵심 축)
-- members 테이블 생성 이후에 정의해야 한다(language sql 함수는 생성 시점에 카탈로그를 검증함).
create or replace function public.auth_couple_id()
returns uuid language sql stable security definer set search_path = public as $$
  select couple_id from public.members where id = auth.uid();
$$;

-- =====================================================================
-- 3) 인덱스 (조회 패턴: 커플 + 날짜)
-- =====================================================================
create index if not exists idx_members_couple        on public.members(couple_id);
create index if not exists idx_events_couple_date     on public.events(couple_id, event_date);
create index if not exists idx_anniv_couple           on public.anniversaries(couple_id, ann_date);
create index if not exists idx_notes_couple_date      on public.notes(couple_id, note_date);
create index if not exists idx_messages_couple_time   on public.messages(couple_id, created_at desc);
create index if not exists idx_photos_couple_date     on public.photos(couple_id, photo_date desc);
create index if not exists idx_photos_attached        on public.photos(attached_to_type, attached_to_id);
create unique index if not exists idx_couples_invite  on public.couples(invite_code);

-- =====================================================================
-- 4) 트리거 (updated_at 자동 / user_id 자동)
-- =====================================================================
-- updated_at 있는 테이블
do $$
declare t text;
begin
  foreach t in array array['couples','members','events','anniversaries','notes']
  loop
    execute format('drop trigger if exists trg_updated_at on public.%I;', t);
    execute format('create trigger trg_updated_at before update on public.%I
                    for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- user_id 자동 세팅 (모든 테이블)
do $$
declare t text;
begin
  foreach t in array array['couples','members','events','anniversaries','notes','messages','photos']
  loop
    execute format('drop trigger if exists trg_set_user_id on public.%I;', t);
    execute format('create trigger trg_set_user_id before insert on public.%I
                    for each row execute function public.set_user_id();', t);
  end loop;
end $$;

-- =====================================================================
-- 5) RLS 활성화
-- =====================================================================
alter table public.couples       enable row level security;
alter table public.members       enable row level security;
alter table public.events        enable row level security;
alter table public.anniversaries enable row level security;
alter table public.notes         enable row level security;
alter table public.messages      enable row level security;
alter table public.photos        enable row level security;

-- 5-1) couples : 생성자이거나 내가 속한 커플
drop policy if exists couples_select on public.couples;
create policy couples_select on public.couples for select
  using (user_id = auth.uid() or id = public.auth_couple_id());
drop policy if exists couples_insert on public.couples;
create policy couples_insert on public.couples for insert
  with check (user_id = auth.uid());
drop policy if exists couples_update on public.couples;
create policy couples_update on public.couples for update
  using (id = public.auth_couple_id() or user_id = auth.uid());

-- 5-2) members : 자기 자신 + 같은 커플 파트너 조회, 수정은 자기 행만
drop policy if exists members_select on public.members;
create policy members_select on public.members for select
  using (id = auth.uid() or couple_id = public.auth_couple_id());
drop policy if exists members_insert on public.members;
create policy members_insert on public.members for insert
  with check (id = auth.uid());          -- 남의 멤버 행 못 만든다
drop policy if exists members_update on public.members;
create policy members_update on public.members for update
  using (id = auth.uid());

-- 5-3~7) 콘텐츠 테이블 공통: 내가 속한 커플의 행만 CRUD
do $$
declare t text;
begin
  foreach t in array array['events','anniversaries','notes','messages','photos']
  loop
    execute format('drop policy if exists %1$s_all on public.%1$s;', t);
    execute format($f$
      create policy %1$s_all on public.%1$s
      for all
      using (couple_id = public.auth_couple_id())
      with check (couple_id = public.auth_couple_id() and user_id = auth.uid());
    $f$, t);
  end loop;
end $$;

-- =====================================================================
-- 6) RPC : 커플 생성 / 커플 참여 (RLS 우회가 필요한 안전 지점만 SECURITY DEFINER)
-- =====================================================================

-- 6-1) 커플 만들기: 커플 생성 + 내 멤버행을 role 'a'로 연결. 초대코드 반환.
create or replace function public.create_couple(p_start_date date, p_display_name text default '')
returns text language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_couple uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  -- 이미 커플이면 막기
  if exists (select 1 from members where id = v_uid and couple_id is not null) then
    raise exception 'already in a couple';
  end if;
  v_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)); -- 6자리 코드
  insert into couples(user_id, invite_code, start_date) values (v_uid, v_code, p_start_date)
    returning id into v_couple;
  -- 내 멤버행 보장(없으면 생성) 후 커플 연결
  insert into members(id, user_id, couple_id, display_name, role, color)
    values (v_uid, v_uid, v_couple, coalesce(nullif(p_display_name,''),''), 'a', '#E8927C')
  on conflict (id) do update
    set couple_id = excluded.couple_id, role = 'a',
        display_name = coalesce(nullif(excluded.display_name,''), members.display_name);
  return v_code;
end; $$;

-- 6-2) 커플 참여: 초대코드로 상대 커플에 role 'b'로 합류.
create or replace function public.join_couple(p_code text, p_display_name text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_couple uuid;
  v_count int;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select id into v_couple from couples where invite_code = upper(p_code);
  if v_couple is null then raise exception 'invalid code'; end if;
  select count(*) into v_count from members where couple_id = v_couple;
  if v_count >= 2 and not exists (select 1 from members where id=v_uid and couple_id=v_couple) then
    raise exception 'couple is full';
  end if;
  insert into members(id, user_id, couple_id, display_name, role, color)
    values (v_uid, v_uid, v_couple, coalesce(nullif(p_display_name,''),''), 'b', '#A7B99A')
  on conflict (id) do update
    set couple_id = excluded.couple_id, role = 'b',
        display_name = coalesce(nullif(excluded.display_name,''), members.display_name);
  return v_couple;
end; $$;

-- 6-3) 커플 끊기: 나와 상대 양쪽 members.couple_id/role을 null로 되돌린다.
--      couples 행과 그 안의 events/notes/anniversaries/messages/photos는 지우지 않는다
--      (되돌릴 수 있게 — 같은 초대코드로 다시 join_couple 하면 예전 데이터가 그대로 복원됨).
create or replace function public.unlink_couple()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_couple uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select couple_id into v_couple from members where id = v_uid;
  if v_couple is null then raise exception 'not in a couple'; end if;
  update members set couple_id = null, role = null where couple_id = v_couple;
end; $$;

-- =====================================================================
-- 7) Storage : photos 버킷 + 커플 폴더 단위 접근 정책
--    경로 규칙: <couple_id>/<yyyy>/<mm>/<uuid>.webp
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('photos','photos', false)
on conflict (id) do nothing;

drop policy if exists photos_read on storage.objects;
create policy photos_read on storage.objects for select
  using (bucket_id = 'photos'
         and (storage.foldername(name))[1] = public.auth_couple_id()::text);

drop policy if exists photos_write on storage.objects;
create policy photos_write on storage.objects for insert
  with check (bucket_id = 'photos'
         and (storage.foldername(name))[1] = public.auth_couple_id()::text);

drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects for delete
  using (bucket_id = 'photos'
         and (storage.foldername(name))[1] = public.auth_couple_id()::text);

-- upsert(update)로 같은 경로에 다시 올릴 때 필요(예: 아바타 사진 교체) — 없으면
-- INSERT ... ON CONFLICT DO UPDATE 의 update 분기가 막혀 재업로드가 조용히 실패한다.
drop policy if exists photos_update on storage.objects;
create policy photos_update on storage.objects for update
  using (bucket_id = 'photos'
         and (storage.foldername(name))[1] = public.auth_couple_id()::text)
  with check (bucket_id = 'photos'
         and (storage.foldername(name))[1] = public.auth_couple_id()::text);

-- =====================================================================
-- 8) Realtime : 변경을 상대에게 실시간 전파할 테이블만 등록
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['events','anniversaries','notes','messages','photos','members']
  loop
    -- 이미 등록돼 있으면 무시
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- =====================================================================
-- 끝. 확인 쿼리(선택): select public.auth_couple_id();  -- 로그인 상태에서 커플 id 반환
-- =====================================================================

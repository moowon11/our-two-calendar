# BUILD_KIT.md — 우리 둘의 캘린더 / 오늘 하루치 빌드킷

> 이 문서 하나 + 함께 제공된 실물 파일(`project-state.yaml`, `decisions.md`, `blockers.md`, `schema.sql`)로
> 오늘 작업을 사람 개입 없이 진행할 수 있게 구성했다. 스택: **Next.js(App Router) + TypeScript + Tailwind + Supabase**, 배포 **Vercel**.
> (AI 기능은 사용자 결정으로 이번 범위에서 제외 — 담백함 유지.)

## 모든 구현 프롬프트에 공통으로 박힌 규칙 (G-RULES)
아래 문장은 이 문서의 모든 "구현 프롬프트" 안에 이미 들어가 있다. 복사해서 쓸 때 지우지 말 것.
- **placeholder 금지:** 기능을 생략하거나 "TODO", 더미 데이터, 주석 처리로 때우지 말 것. 명세된 기능은 실제로 동작해야 한다.
- **증거 우선:** "끝났다"고 말하기 전에 반드시 증거를 보일 것 — `npm run build` 통과 로그, 또는 해당 화면 스크린샷/동작 설명. 증거 없이 완료 선언 금지.
- **키 노출 금지:** 서버 비밀키(예: Supabase service_role)는 서버 전용 env로만. 클라이언트 번들에 절대 넣지 말 것.
- **상태 4종:** 데이터가 있는 화면은 로딩/비어있음/에러/성공을 전부 구현할 것. 하나라도 빠지면 미완성.

---

# 0. STATE_INIT

진행 추적은 아래 세 파일로 한다(별도 파일로 제공됨).
- **`project-state.yaml`** — 페이즈/화면별 상태(todo→in_progress→done)와 `evidence`(빌드로그·스크린샷·커밋). "지금 어디까지"의 단일 진실 소스.
- **`decisions.md`** — 오케스트레이터가 알아서 정한 결정과 이유(스택, owner 모델링, 이미지 압축 등). 뒤집을 때 근거 확인용.
- **`blockers.md`** — 막힌 곳·우회. 자주 터지는 지점(무료 일시정지, RLS 0행, Realtime publication 누락 등)을 예방적으로 미리 기록.

> 규칙: 각 단계 종료 시 `project-state.yaml`의 해당 `status`와 `evidence`를 갱신하고, 새 문제는 `blockers.md` 맨 위에 추가한다. 지정된 `02_reference_code/*.example` 양식 파일이 환경에 없어 커플 캘린더에 맞게 자체 정의했다(→ decisions D-004).

---

# 1. PAGE_LIST

우선순위: **S=오늘 반드시 / A=오늘 목표 / B=여유되면**. 상태 열은 각 화면이 가질 수 있는 상태.

| # | 화면 | 한 줄 목적 | 들어가는 데이터 | 가질 수 있는 상태 | 우선순위 |
|---|------|-----------|----------------|------------------|:---:|
| 0 | 로그인·커플 연결 | 로그인하고 초대코드로 둘을 잇기 | auth 세션, couples(invite_code, start_date), members | 로딩 / 미인증 / 연결대기(빈) / 에러 / 성공 | **S** |
| 0b | 회원가입 | 새 계정 만들기 | 이메일·비번(Supabase Auth) | 로딩 / 입력검증실패 / 에러 / 성공 | **S** |
| 1 | 메인 월간 캘린더 | 한 달을 한눈에, 너/나/우리 색으로 | events, anniversaries, photos(썸네일), members | 로딩(스켈레톤) / 비어있음 / 에러 / 성공 / 실시간갱신 | **S** |
| 2 | 날짜 상세 | 그날의 일정·메모·사진 모아보기 | events, notes, photos (해당 date) | 로딩 / 비어있음 / 에러 / 성공 | **S** |
| 3 | 일정 추가·편집 | 일정 만들기 | events(쓰기), members | 폼 / 저장중 / 저장에러(입력보존) / 성공 | **S** |
| 4 | 기념일·디데이 | 기념일 관리 + D-day | anniversaries | 로딩 / 비어있음 / 에러 / 성공 | **A** |
| 5 | 추억 모아보기 | 사진 붙은 날들을 앨범/타임라인으로 | photos(+연결된 date) | 로딩 / 비어있음 / 에러 / 성공 | **A** |
| 6 | 쪽지 | 서로에게 짧은 쪽지 | messages, members | 로딩 / 비어있음 / 에러 / 성공 / 실시간갱신 | **B** |
| - | 권한없음/404 | 남의 커플·로그아웃 접근 차단 | - | 권한없음 / 미인증 리다이렉트 | **S** |

**로그인/회원가입**은 0/0b로 명시됨.

### (참고) 추가하면 좋을 기능 제안 — 반영 여부는 사용자 결정
기획서 범위 밖이라 넣지 않았지만, 오늘 수업 기능 중 이 제품과 어울리는 것:
- **AI(제외):** 자연어 일정 입력·기념일 문구 추천을 검토했으나 담백함 위해 제외.
- **외부 캘린더 연동 API(보류):** 구글/애플 일정 가져오기. 무드 희석 우려로 이번 제외.
- **결제·광고(제외):** 둘만의 사적 공간이라 부적합.
- (클라우드 저장·로그인·실시간은 이미 본문에 편입됨.)

---

# 2. STYLE_GUIDE

한 장으로 보는 시각 정체성. **일러스트·디자인·코드는 전부 이 값을 참조**한다.

- **무드 키워드:** 포근한 · 손글씨 다이어리 · 파스텔 · 다정한 · 크림빛 종이
- **색 (hex 고정)**
  | 역할 | 이름 | hex |
  |------|------|-----|
  | main(나/강조) | 코랄 | `#E8927C` |
  | secondary(너) | 세이지 | `#A7B99A` |
  | accent(우리) | 살구 | `#F2C6A0` |
  | background | 크림 종이 | `#FBF6EE` |
  | surface(카드) | 화이트 크림 | `#FFFDF9` |
  | ink(본문 글자) | 웜 다크브라운 | `#4A4038` |
  | ink-soft(보조 글자) | 톤다운 브라운 | `#8B8178` |
  | line(테두리) | 연베이지 | `#EFE6DA` |
  | success | 부드러운 그린 | `#7FA87A` |
  | danger | 톤다운 테라코타 | `#D98878` |
- **글꼴 성격:** 강조(제목·날짜·D-day·짧은 문구)는 **손글씨 계열**(예: Gaegu / Nanum Pen Script) — 강조에만. 본문·일정 텍스트는 **둥근 고딕**(예: Pretendard). 손글씨 남발 금지.
- **모서리·간격:** 모서리는 **둥글게**(카드 16–20px, 버튼은 pill). 간격은 **여유롭게**(촘촘하지 않게, 숨 쉬는 여백). 그림자는 얕고 부드럽게.
- **일러스트 스타일 한 줄:** 파스텔 플랫 일러스트, 굵은 외곽선 없음, 종이 질감의 부드러운 그레인, 위 팔레트만 사용.

---

# 3. ILLUST_PROMPTS

그림이 필요한 자리: **① 로그인/연결 히어로 ② 빈 캘린더 ③ 빈 추억 ④ 빈 쪽지 ⑤ 연결대기**. 모든 프롬프트는 아래 **공유 스타일 문장**을 그대로 포함해 한 세트로 보이게 한다. 이미지 생성 AI에 그대로 붙여넣기.

> **[SHARED STYLE — 모든 프롬프트에 그대로 포함]** Soft pastel flat illustration, no bold outlines, gentle paper-grain texture, warm cozy diary mood. Use only this palette: coral #E8927C, sage #A7B99A, apricot #F2C6A0, cream paper #FBF6EE background, warm dark-brown ink #4A4038. Soft rounded shapes, calm and tender. No text anywhere in the image.

- **① 로그인/연결 히어로** — Two abstract rounded characters gently connecting a small paper thread/heart between them, symbolizing a couple linking their private space. Centered composition, generous empty space at top and bottom for UI. Aspect ratio 3:2, background filled with cream paper #FBF6EE (no transparency). [SHARED STYLE]
- **② 빈 캘린더 상태** — A cozy open blank paper diary with a tiny sprig of leaves resting on the corner, inviting the first entry. Friendly and calm, lots of soft empty space. Aspect ratio 1:1, cream #FBF6EE background. [SHARED STYLE]
- **③ 빈 추억(사진) 상태** — A single empty polaroid-style frame tilted slightly, with a small dotted heart, waiting for the first photo. Aspect ratio 1:1, cream #FBF6EE background. [SHARED STYLE]
- **④ 빈 쪽지 상태** — A small folded note/letter with a tiny heart seal, softly placed, hinting at a first message. Aspect ratio 1:1, cream #FBF6EE background. [SHARED STYLE]
- **⑤ 연결 대기 상태** — One rounded character holding a paper thread that trails off-frame, calmly waiting for the other end to be picked up. Aspect ratio 1:1, cream #FBF6EE background. [SHARED STYLE]

---

# 4. DESIGN_PROMPT  (claude.ai/design 에 그대로 붙여넣기)

```
따뜻한 파스텔 다이어리 무드의 커플 공유 캘린더 웹앱을 디자인해줘. 캘린더인데 사무적이지 않고, "펼치고 싶은 다이어리" 같은 다정함이 핵심이야. 모바일 390px와 데스크톱 1280px 두 폭을 모두 그려줘.

[디자인 토큰 — 모든 화면은 이 토큰만 참조]
색: --main(코랄) #E8927C / --secondary(세이지) #A7B99A / --accent(우리·살구) #F2C6A0 / --bg(크림종이) #FBF6EE / --surface #FFFDF9 / --ink #4A4038 / --ink-soft #8B8178 / --line #EFE6DA / --success #7FA87A / --danger #D98878
글꼴: 강조(제목/날짜/D-day/짧은 문구)=손글씨 계열, 본문/일정=둥근 고딕. 손글씨는 강조에만.
모서리: 카드 16–20px, 버튼 pill. 간격: 여유롭게, 얕고 부드러운 그림자. 일러스트: 파스텔 플랫, 굵은 외곽선 없음.
색 의미: 나=코랄, 너=세이지, 우리=살구. 일정 점/배지에 이 색을 쓴다.

[화면 — 각 화면에 표시되는 데이터와 상태를 모두 그려줘]
0) 로그인·커플 연결: 로그인 폼(이메일/비번), 회원가입 전환. 연결 단계=초대코드 생성 or 입력 + 사귄 날 선택. 상태: 로딩 / 연결대기(빈 상태, 일러스트 ⑤ 자리) / 에러 / 성공.
1) 메인 월간 캘린더: 상단에 "우리 만난 지 D+○○일" 위젯 + 다가오는 기념일 1개. 월간 격자, 날짜 칸에 너/나/우리 색 점과 사진 썸네일. 우하단 + 버튼. 상태: 로딩(격자 스켈레톤) / 비어있음(일러스트 ② + "아직 텅 빈 달력이야, 첫 일정을 남겨볼까?") / 에러("달력을 불러오지 못했어" + 다시시도) / 성공 / 방금 상대가 추가한 항목이 살짝 반짝이는 실시간 상태.
2) 날짜 상세: 그날의 일정(너/나/우리 구분 배지), 한 줄 메모/일기, 붙은 사진들. 일정/메모/사진 추가 입구 3개. 상태: 로딩 / 비어있음("이 날은 아직 조용하네") / 에러 / 성공.
3) 일정 추가·편집: 상세 폼(제목·날짜·시간·주인 너/나/우리·색·메모·반복·사진첨부). 상태: 폼 / 저장중 / 저장에러("방금 쓴 내용 그대로 남겨둠") / 성공(하트 애니메이션).
4) 기념일·디데이: 기념일 카드 목록 + 각 D-day 카운트다운 + 매년 반복 토글 + 위젯 고정. 상태: 로딩 / 비어있음 / 에러 / 성공.
5) 추억 모아보기: 사진 붙은 날들을 최신순/월별 앨범 그리드. 사진 탭→날짜 상세. 상태: 로딩(흐린 블록) / 비어있음(일러스트 ③) / 에러 / 성공.
6) 쪽지: 주고받은 짧은 쪽지 목록 + 작성. 읽음 표시. 상태: 로딩 / 비어있음(일러스트 ④) / 에러 / 성공 / 실시간 새 쪽지.

[말투] 앱이 말을 걸 때는 다정한 반말. 명령형·기계 안내문 금지.
[일러스트] 빈 상태/히어로 자리에는 "첨부한 일러스트를 이 자리에 배치"로 지시. 없으면 파스텔 플랫 일러스트로 대체.
[반응형] 390px는 단일 컬럼·하단 탭바, 1280px는 좌측 사이드 내비 + 넓은 캘린더. 두 폭 모두 완성해줘.
모든 텍스트는 한국어로.
```

---

# 5. DATA_MODEL

전체 테이블·컬럼·관계 요약(실제 적용 SQL은 함께 제공된 **`schema.sql`** — Supabase SQL Editor에 그대로 붙여넣기).

**관계**
- `couples` 1 — N `members` (한 커플에 멤버 2명)
- `couples` 1 — N `events / anniversaries / notes / messages / photos`
- `members` 1 — N `events(owner_id)`, `notes(author_id)`, `messages(from_id,to_id)`
- `photos.attached_to_id` → `events.id` 또는 `notes.id` (type로 구분; date면 null)

**테이블·핵심 컬럼**
- **couples**: `id`, `user_id`(생성자), `invite_code`(unique), `start_date`, `theme`, `created_at`, `updated_at`
- **members**: `id`(=auth uid, PK/FK), `user_id`, `couple_id`(FK), `display_name`, `color`, `role`('a'/'b')
- **events**: `id`, `user_id`, `couple_id`(FK), `title`, `event_date`, `start_time`, `end_time`, `owner_kind`('individual'/'shared'), `owner_id`(FK members), `memo`, `repeat_rule`, `updated_by`, `updated_at`
- **anniversaries**: `id`, `user_id`, `couple_id`(FK), `title`, `ann_date`, `repeat_yearly`, `pinned_to_widget`, `updated_by`
- **notes**: `id`, `user_id`, `couple_id`(FK), `note_date`, `content`, `author_id`(FK members), `updated_by`
- **messages**: `id`, `user_id`, `couple_id`(FK), `content`, `from_id`, `to_id`, `read_at`, `created_at`
- **photos**: `id`, `user_id`, `couple_id`(FK), `storage_path`, `caption`, `photo_date`, `attached_to_type`, `attached_to_id`

**인덱스**(schema.sql에 포함): events(couple_id,event_date) / notes(couple_id,note_date) / photos(couple_id,photo_date) / messages(couple_id,created_at) / anniversaries(couple_id) / members(couple_id) / couples(invite_code).

**보안·인프라(schema.sql에 포함)**: 모든 테이블 RLS on("내 커플의 행만"), `user_id` 자동세팅 트리거, `updated_at` 자동갱신 트리거, `create_couple()/join_couple()` RPC, `photos` Storage 버킷 + 커플 폴더 정책, 실시간 publication 등록.

> owner를 'me/you/us'로 저장하지 않는 이유는 decisions D-002 참고(상대 화면에서 라벨이 뒤집히는 버그 방지).

---

# 6. BUILD_ORDER

의존 순서: 0-scaffold → 1-db → 2-auth-couple → 3-calendar → (4-anniversary / 6-messages) → 4-day-detail → 5-event-form → 7-memories → 9-polish.
아래 프롬프트는 **Claude Code에 그대로 붙여넣기**. 모든 프롬프트에 G-RULES가 들어가 있다.

## (A) 한 페이지씩 버전

**A-0 · 프로젝트 뼈대**
```
우리 둘의 커플 캘린더 웹앱을 시작한다. 이 단계만 하고 멈춰라.
- Next.js(App Router)+TypeScript+Tailwind로 프로젝트 생성. Supabase JS 클라이언트 설치·초기화(서버/클라 분리).
- STYLE_GUIDE 색·글꼴·모서리를 Tailwind 테마 토큰(CSS 변수)으로 정의: main #E8927C, secondary #A7B99A, accent #F2C6A0, bg #FBF6EE, surface #FFFDF9, ink #4A4038, ink-soft #8B8178, line #EFE6DA, success #7FA87A, danger #D98878. 손글씨/둥근고딕 폰트 연결.
- .env.local.example에 필요한 키 목록만 작성(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY). 실제 키는 비워둠. 서버 비밀키를 클라이언트에 노출하지 말 것.
[규칙] placeholder/기능생략 금지. 키를 클라이언트 번들에 넣지 말 것. 끝나면 npm run build 통과 로그를 보이고, 토큰이 실제로 적용된 샘플 페이지 1개를 캡처로 보여라. 그 전엔 완료라고 하지 마라.
```

**A-1 · DB 적용**
```
함께 제공된 schema.sql을 사용한다. 이 단계만 하고 멈춰라.
- Supabase SQL Editor에 schema.sql 전체를 붙여넣어 실행하는 절차를 안내하고, 앱 코드에서 쓸 타입(테이블 인터페이스)을 생성하라.
- create_couple / join_couple RPC 호출 래퍼 함수를 만들어라.
[규칙] placeholder 금지. 끝나면 (1) 각 테이블이 생성됐는지 확인 쿼리 결과, (2) RLS가 켜졌는지, (3) select public.auth_couple_id() 가 동작하는지 증거를 보여라. 그 전엔 완료라고 하지 마라.
```

**A-2 · 로그인·커플 연결(화면 0)**
```
로그인·회원가입·커플 연결 화면만 구현하고 멈춰라(다른 화면 만들지 말 것).
- Supabase Auth 이메일 로그인/회원가입. 로그인 후 members 행 없거나 couple_id 없으면 연결 단계로.
- 연결: 초대코드 생성(create_couple, 사귄 날 입력) 또는 코드 입력(join_couple). 연결대기 빈 상태 포함.
- 상태 전부: 로딩/미인증/연결대기(빈)/에러/성공. 로그아웃 상태로 내부 접근 시 이 화면으로 리다이렉트.
- STYLE_GUIDE 토큰만 사용, 말투는 다정한 반말.
[규칙] placeholder/기능생략 금지, 상태 4종 필수, 키 노출 금지. 끝나면 npm run build 통과 + 로그인→연결→메인 진입 흐름을 캡처나 단계 설명으로 증거 제시. 그 전엔 완료라고 하지 마라.
```

**A-3 · 메인 월간 캘린더(화면 1) + 실시간**
```
메인 월간 캘린더 화면만 구현하고 멈춰라.
- 상단 D+위젯(couples.start_date 기준)과 다가오는 기념일 1개. 월간 격자에 events를 너/나/우리 색 점으로, 사진 있는 날은 photos 썸네일.
- Supabase Realtime으로 events 변경 구독 → 새로고침 없이 반영, 방금 바뀐 항목 잠깐 반짝임.
- 상태 전부: 로딩(스켈레톤)/비어있음(안내문+추가버튼)/에러(다시시도)/성공.
[규칙] placeholder 금지, 상태 4종 필수. 끝나면 npm run build 통과 + 일정 하나 추가 시 화면에 실제로 뜨는 것(가능하면 두 세션 실시간 반영)을 증거로 보여라. 그 전엔 완료라고 하지 마라.
```

**A-4 · 날짜 상세(화면 2)** — *A-3 완료 후*
```
날짜 상세 화면만 구현하고 멈춰라. 특정 날짜의 events/notes/photos를 모아 보여주고, 일정·메모·사진 추가 입구 3개. 상태 전부(로딩/비어있음/에러/성공). [규칙] placeholder 금지, 상태 4종 필수. 끝나면 build 통과 + 한 날짜에 메모·사진이 실제로 저장/표시되는 증거를 보여라.
```

**A-5 · 일정 추가·편집(화면 3)**
```
일정 추가/편집 화면만 구현하고 멈춰라.
- 폼: 제목·날짜·시간·주인(너/나/우리=owner_kind+owner_id)·색·메모·반복·사진첨부(업로드 전 클라이언트 리사이즈 최대 장변 1600px).
- 상태 전부: 폼/저장중/저장에러(입력 보존)/성공(하트 애니메이션).
[규칙] placeholder 금지. 끝나면 build 통과 + 일정이 실제로 저장되고, 저장 실패 시 입력이 보존되는 것을 증거로 보여라.
```

**A-6 · 기념일·디데이(화면 4)**
```
기념일 화면만 구현하고 멈춰라. 기념일 CRUD + D-day 카운트다운 + 매년반복 + 위젯고정. 상태 전부. [규칙] placeholder 금지. 끝나면 build 통과 + D-day가 오늘 기준 정확히 계산되는 증거를 보여라.
```

**A-7 · 추억 모아보기(화면 5)**
```
추억 모아보기 화면만 구현하고 멈춰라. photos를 최신순/월별 앨범 그리드로, 사진 탭 시 해당 날짜 상세로 이동. 상태 전부(로딩 흐린블록/비어있음/에러/성공). [규칙] placeholder 금지, 상태 4종 필수. 끝나면 build 통과 + 사진이 실제로 그리드에 뜨고 날짜 상세로 연결되는 증거를 보여라.
```

**A-8 · 쪽지(화면 6)**
```
쪽지 화면만 구현하고 멈춰라. messages 목록·작성·읽음표시, Realtime 새 쪽지 반영. 상태 전부. [규칙] placeholder 금지. 끝나면 build 통과 + 쪽지 작성/수신 증거를 보여라.
```

**A-9 · 마감 폴리시**
```
새 기능 추가 없이, 전체를 마감 품질로 끌어올리고 멈춰라. 모든 화면의 로딩/빈/에러 상태 점검·보강, 반응형 390/1280 정리, 접근성(대비·포커스·라벨), 토큰 일관성, 키 노출 grep 확인. [규칙] placeholder 금지. 끝나면 QUALITY_BAR 전 항목을 통과/실패로 자가 채점한 표 + npm run build 통과 로그를 증거로 보여라.
```

## (B) 한꺼번에 버전
```
아래 명세로 커플 공유 캘린더 웹앱 전체를 한 번에 구현하라. 축소·생략 없이 전부.
- 스택: Next.js(App Router)+TS+Tailwind+Supabase(Auth/DB/Storage/Realtime). 배포 Vercel 가정.
- DB: 함께 제공된 schema.sql 적용(테이블/RLS/트리거/RPC/Storage/Realtime).
- 화면 0,0b,1~6 전부 + 각 화면의 로딩/비어있음/에러/성공(+실시간) 상태 전부.
- 디자인 토큰(STYLE_GUIDE 색·글꼴·모서리)만 참조. 말투는 다정한 반말. 반응형 390/1280.
- 이미지 업로드는 클라이언트 리사이즈 후 Storage(커플 폴더).
[규칙] placeholder/더미/TODO/기능생략 금지. 서버 비밀키 클라이언트 노출 금지. 스스로 npm run build를 실행해 통과할 때까지 고쳐라. 끝났다고 말하기 전에 (1) npm run build 통과 로그, (2) 각 화면이 렌더되는 증거, (3) 로그인→연결→일정추가→사진→쪽지 핵심 흐름 동작을 반드시 보여라. 증거 없이 완료 선언 금지.
```

---

# 7. QUALITY_BAR

각 항목 통과/실패로 채점. 하나라도 실패면 "출시 가능" 아님.

| # | 항목 | 통과 기준 | 통과/실패 |
|---|------|-----------|:---:|
| 1 | 빌드 | `npm run build` 에러 0으로 통과 | ☐ |
| 2 | 반응형 390 | 모바일 폭에서 겹침/넘침 없음, 하단 탭 동작 | ☐ |
| 3 | 반응형 1280 | 데스크톱 폭에서 레이아웃·사이드내비 정상 | ☐ |
| 4 | 로딩 상태 | 데이터 화면 전부 스켈레톤/인디케이터 존재 | ☐ |
| 5 | 빈 상태 | 데이터 0일 때 안내문+행동 유도(삭막한 빈칸 아님) | ☐ |
| 6 | 에러 상태 | 실패 시 안내+다시시도, 데이터 유실 아님 명시 | ☐ |
| 7 | 토큰 일관성 | 하드코딩 색 없음, STYLE_GUIDE 토큰만 사용 | ☐ |
| 8 | 접근성 | 색대비 AA, 키보드 포커스, 폼 라벨/alt 존재 | ☐ |
| 9 | 키 노출 없음 | 번들 grep에 서버 비밀키(service_role 등) 없음 | ☐ |
| 10 | RLS 적용 | 상대 커플 데이터 조회 불가(다른 계정으로 확인) | ☐ |
| 11 | 실시간 | 한 세션 변경이 다른 세션에 새로고침 없이 반영 | ☐ |
| 12 | 이미지 | 업로드 전 리사이즈 적용, 커플 폴더에만 저장 | ☐ |
| 13 | owner 라벨 | 나/너/우리가 각 계정 시점에서 올바르게 표시 | ☐ |
| 14 | 말투 | 안내문이 다정한 반말, 기계적 문구 없음 | ☐ |

---

# 8. EDGE_CASES

| 상황 | 처리 |
|------|------|
| 네트워크 끊김 | 쓰기 실패 시 입력값 보존 + "다시 시도" 노출. 읽기 실패는 캐시/직전 화면 유지 후 재시도 버튼. |
| 빈 입력(폼) | 저장 버튼 비활성 또는 검증 메시지. 빈 값 저장 금지. |
| 아주 긴 입력 | 텍스트 필드 maxlength로 상한, 초과 시 안내. |
| 권한 없는 접근 | RLS로 0행 반환 + UI는 "권한없음"/리다이렉트. URL로 남의 리소스 접근 차단. |
| 중복 제출 | 저장 중 버튼 비활성 + 요청 in-flight 가드(더블클릭 방지). |
| 첫 사용자(데이터 0) | 각 화면 빈 상태로 안내(캘린더/추억/쪽지/기념일). 크래시 아님. |
| 로그아웃 상태 접근 | 미들웨어에서 세션 확인 → 로그인 화면으로. |
| 커플 미연결 상태 | 연결 화면으로 유도, 콘텐츠 화면 진입 차단. |
| 동시 편집 | last-write-wins + `updated_at`/`updated_by`로 "방금 상대가 바꿈" 표시. 실시간으로 최신 반영. |
| 초대코드 오입력/만료 | "코드를 다시 확인해줘" + 상대 데이터 무영향. 이미 2명이면 "커플이 가득 참". |
| 큰 사진/이상 파일 | 클라이언트 리사이즈+용량 상한, 이미지 아닌 파일 거부. |
| 무료 프로젝트 일시정지 | 데모 전 resume, 필요 시 헬스핑(blockers PRE-01). |

---

# 9. RISKS (막히면 그대로 붙여넣는 회복 프롬프트)

- **R-1. RLS 켠 뒤 데이터가 안 보임(빈 화면, 에러 없음)**
```
지금 로그인은 되는데 events/notes가 하나도 안 보인다. RLS 때문으로 의심된다. members 테이블에서 현재 사용자 행의 couple_id가 실제로 채워졌는지, auth_couple_id()가 null이 아닌지 확인하는 쿼리를 만들고, 커플 연결(create_couple/join_couple)이 정상 수행됐는지 점검하라. 원인을 찾아 고치고, 두 계정으로 각자 자기 커플 데이터만 보이는지 증거로 보여라. placeholder 금지.
```
- **R-2. Realtime 이벤트가 안 옴**
```
Supabase Realtime 구독을 붙였는데 상대 세션 변경이 반영되지 않는다. 대상 테이블이 supabase_realtime publication에 등록됐는지(schema.sql 8번), 클라이언트 채널 구독/해제가 올바른지 점검해 고쳐라. 두 브라우저에서 한쪽 추가가 다른 쪽에 새로고침 없이 뜨는 것을 증거로 보여라.
```
- **R-3. 이미지 업로드 실패 / 용량 폭증**
```
사진 업로드가 실패하거나 저장 용량이 빠르게 는다. 업로드 전에 클라이언트에서 장변 1600px로 리사이즈+압축(webp/jpeg ~0.8)하도록 고치고, Storage 경로가 <couple_id>/... 폴더 규칙과 정책에 맞는지 점검하라. 실제 업로드가 되고 커플 폴더에만 저장되는 것을 증거로 보여라.
```
- **R-4. owner "나/너/우리"가 상대 화면에서 뒤집혀 보임**
```
일정의 나/너/우리 표시가 상대 계정에서 반대로 보인다. DB에는 owner_kind/owner_id로 저장하고, UI에서 현재 로그인 멤버와 비교해 라벨을 계산하도록 고쳐라. 두 계정에서 같은 일정이 각자 시점으로 올바르게(내 것=나, 상대 것=너, 공동=우리) 보이는지 증거로 보여라.
```
- **R-5. build 실패**
```
npm run build 가 실패한다. 에러 로그를 읽고 타입/임포트/서버-클라이언트 경계 문제를 하나씩 고쳐라. 기능을 지우거나 주석 처리해서 통과시키지 말 것. 통과한 build 로그 전문을 증거로 보여라.
```

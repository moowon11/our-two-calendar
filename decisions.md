# decisions.md — 자동 결정 로그
# (02_reference_code/decisions.md.example 의 형식을 따르고, 커플 캘린더 프로젝트에서 실제로 내린 결정을 채웠다.)

AI가 사람에게 묻지 않고 default로 정한 것들. 형식: `결정 / 이유 / 되돌리는 법`.
이현이 나중에 "여긴 다르게 갈래" 할 때 되돌릴 지점 목록이 된다.

- 기술 스택 = Next.js(App Router) + TypeScript + Tailwind + shadcn/ui + Supabase + Vercel / 로그인·클라우드 저장·실시간이 전부 기획서 본문 기능인데 Supabase 하나로 Auth+DB+Storage+Realtime을 무료 플랜 안에서 다 덮고 Vercel 배포와 궁합이 좋음(Firebase는 NoSQL이라 커플 단위 권한 모델을 RLS로 못 짜서 제외) / 되돌리려면 supabase-client.ts·supabase-server.ts를 다른 BaaS SDK로 교체
- 일정 소유자(owner) 모델링 = DB에는 `owner_kind`(individual|shared)+`owner_id`로 저장, "나/너/우리" 라벨은 화면에서 로그인한 member 기준으로 계산 / "나/너/우리"는 보는 사람 기준 상대적 라벨이라 DB에 enum('me'/'you'/'us')으로 그대로 저장하면 상대 화면에서 뒤집히는 버그가 확정적이라 폐기 / 되돌리려면 라벨 계산 로직만 클라이언트에서 수정
- 모든 테이블 = `user_id`(생성자 auth uid) + `couple_id`(소속 커플) 동시 보유 / 요구사항이 "모든 테이블에 user_id"이지만 실제 접근 제어의 축은 커플이라 RLS는 couple_id 기준으로 걸고 user_id는 감사·작성자 표시·쪽지 등 세분 권한에 사용 / 되돌리려면 RLS 정책만 재정의
- 상태 추적 3파일(project-state.yaml/decisions.md/blockers.md) 양식 = 처음엔 자체 정의했으나(당시 02_reference_code/*.example 파일이 작업 환경에 없었음), 2026-07-04 예시 파일을 확보한 뒤 이 템플릿 형식으로 재구성함 / 예시 파일이 지정한 표준 형식을 따르는 편이 다른 세션·다른 프로젝트와 호환됨 / 되돌리려면 git 이력의 이전 커스텀 양식으로 되돌림
- 이미지 처리 = 업로드 전 클라이언트에서 리사이즈/압축(최대 장변 1600px, WebP/JPEG 품질 ~0.8) / Supabase 무료 파일 저장 1GB·대역폭 한도를 오래 쓰기 위함(원본 그대로 업로드하면 무료 용량을 금방 소진해 폐기) / 되돌리려면 업로드 전 리사이즈 단계만 제거
- AI 기능 = 자연어 일정 입력·기념일 문구 추천 등 전부 제거(`/api/ai/*` 라우트, Anthropic 의존성, `ANTHROPIC_API_KEY`/`AI_MODEL` env, 관련 상태화면 전부 삭제) / 사용자가 담백함 유지를 위해 제외하기로 결정 / 되돌리려면 최소 자연어 입력만 다시 붙일 여지는 남겨둠(서버 비밀키 관리 부담이 다시 생김)
- 실시간 = Supabase Realtime(Postgres Changes) 구독으로 구현 / 별도 소켓 서버 없이 테이블 변경만 구독하면 "상대가 방금 남긴 것"이 새로고침 없이 반영되고, 대상 테이블만 publication에 등록해 대역폭을 아낄 수 있음 / 되돌리려면 polling으로 교체
- 색 기본값 = 나=코랄(`#E8927C`), 너=세이지(`#A7B99A`), 우리=살구(`#F2C6A0`) / 기획서 무드(파스텔·다정)와 STYLE_GUIDE 팔레트에 맞춤 / 되돌리려면 member.color로 각자 덮어쓸 수 있음

- 디자인 토큰 적용 = claude.ai/design에서 임포트한 시안(`우리 캘린더.dc.html`)의 `:root` 변수(main/secondary/accent/bg/surface/ink/ink-soft/line/success/danger, Gaegu/Gowun Dodum 폰트)를 `globals.css`의 shadcn 시맨틱 슬롯(background/foreground/primary/secondary/accent/muted/border/destructive 등)에 그대로 매핑하고, 원본 이름도 `--color-ink`, `--color-ink-soft` 등으로 별도 노출해 화면 코드가 둘 중 편한 이름을 쓰게 함 / 화면 컴포넌트(shadcn ui)는 이미 시맨틱 슬롯만 참조하므로 슬롯 값만 바꾸면 전체가 한번에 반영되고, STYLE_GUIDE 원본 이름도 남겨야 디자인 시안과 코드가 1:1 대응됨 / 되돌리려면 `globals.css`의 `:root`/`.dark` 블록만 원래 oklch 회색조로 복구
- 다크 모드 색 = 시안에 다크 모드가 없어서(파스텔 다이어리 무드는 라이트 전용으로 그려짐) bg/surface/ink/ink-soft/line만 명도를 반전시키고 main/secondary/accent/success/danger 브랜드 색은 그대로 유지하는 방식으로 임의 유도함 / 나중에 실제 다크 시안이 나오면 이 유도값을 교체해야 함 / 되돌리려면 `globals.css`의 `.dark` 블록 값만 교체
- 폰트 = 강조는 Gaegu(손글씨), 본문은 Gowun Dodum(둥근 고딕) — STYLE_GUIDE는 예시로 Pretendard를 들었지만 실제 임포트된 디자인 시안이 Gowun Dodum을 썼으므로 시안 fidelity를 우선함 / 되돌리려면 `layout.tsx`의 next/font 선언만 교체
- 카드 모서리 반경 = `--radius`를 10px→18px로 올려 STYLE_GUIDE의 "카드 16–20px" 범위에 lg 토큰이 들어오게 함 / 기존 shadcn 기본값(10px)이 스타일가이드보다 각져 있었음 / 되돌리려면 `globals.css`의 `--radius` 한 줄만 수정

- 이메일 확인(Confirm email) = 끄는 것을 권장함 / 디자인 시안에 이메일 인증 화면이 없고, 2인용 개인 앱에 불필요한 마찰이며, Supabase 무료 티어 내장 메일 발송이 시간당 몇 통으로 강하게 제한돼 있어 반복 가입 테스트조차 막힘(실측: signUp 2회 만에 "email rate limit exceeded") / signUp 서버 액션은 이 토글이 켜져 있어도 안전하게 "이메일함을 확인해줘" 상태를 보여주도록 만들어 둠(needsEmailConfirm) / 되돌리려면 Supabase 대시보드 Authentication → Providers → Email → Confirm email 토글만 다시 켜면 됨

- 커플 끊기 = `unlink_couple()` RPC로 나/상대 members.couple_id·role만 null로 되돌리고, couples 행과 그 안의 events/notes/anniversaries/messages/photos는 지우지 않음 / 되돌릴 수 없는 데이터 삭제보다는 "접근을 끊는" 방식이 안전하고, 같은 초대코드로 재join하면 예전 기록이 그대로 복원되는 것도 자연스러운 화해/재연결 경로가 됨 / 되돌리려면(=삭제로 바꾸려면) unlink_couple() 안에서 delete 문을 추가

## (열려 있는 결정 — 사용자 확인 필요)
- (현재 없음) — 이메일 확인 토글은 사용자가 직접 끄기로 확정함(2026-07-04).

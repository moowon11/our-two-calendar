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

## (열려 있는 결정 — 사용자 확인 필요)
- (현재 없음) — AI 제외 결정으로 관련 미결 항목 정리 완료.

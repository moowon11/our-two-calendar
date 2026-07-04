# blockers.md — 막힘·우회 로그
# (02_reference_code/blockers.md.example 의 형식을 따르고, 커플 캘린더 프로젝트에서 예방적으로 기록해 둔 항목을 채웠다.)

30분 이상 막힌 지점과 우회 방법. 멈추지 않고 우회한 뒤 여기에 남긴다.
이현이 아침에/수업 후에 "여기만 손보면 된다"를 한눈에 보는 목록.

아직 실제로 막힌 지점은 없음(구현 시작 전). 아래는 "터질 것이 예상되어 미리 우회를 적어둔" 예방 항목 — 실제로 겪으면 상태를 OPEN(실제 발생)으로 갱신할 것.

- [1-db] Supabase 무료 프로젝트가 7일 미사용 시 자동 일시정지되어 며칠 안 들어가면 "project paused"로 앱이 안 열림 → 데모/제출 전날 대시보드에서 프로젝트 resume, 필요하면 GitHub Actions로 3일마다 헬스핑 요청. 데이터는 보존되므로 손실 아님.
- [2-auth-couple] RLS를 켠 뒤 로그인은 되는데 일정이 하나도 안 보이고 콘솔 에러도 없음 → member 행에 couple_id가 아직 안 붙어 `auth_couple_id()`가 null이라 모든 행이 필터링되는 것이 원인 추정. 커플 연결(초대코드 수락)이 끝나야 데이터가 보인다는 전제를 확인하고, 개발용으로 members에 couple_id를 수동 세팅해 재확인.
- [3-calendar] Realtime을 구독했는데 이벤트가 안 옴 → 해당 테이블이 `supabase_realtime` publication에 등록되지 않은 것이 원인 추정. schema.sql 하단의 `alter publication supabase_realtime add table ...` 블록이 실행됐는지 확인.
- [5-event-form] Storage 업로드 403 / 사진이 안 보임 → 업로드 경로가 커플 폴더 규칙(`<couple_id>/...`)과 안 맞아 Storage 정책에 걸리는 것이 원인 추정. 업로드 경로 첫 폴더가 실제 `auth_couple_id()`와 일치하는지 확인하고, 리사이즈 후 경로 규칙대로 저장.

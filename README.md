# NOVA University Consulting

학생과 컨설턴트가 성적, 비교과 활동, 미팅 기록, 지원 관련 추가 정보를 함께 관리하는 대학 컨설팅 포털입니다.

## 포함 기능

- 단일 관리자 계정 로그인
- 학생 개별 등록, 검색, 선택 및 학생별 진행 현황
- 고등학교/대학교 성적 CRUD
- 경력·비교과 활동 CRUD
- 컨설팅 미팅 기록 및 다음 액션 CRUD
- 지원 국가·전공·예산·시험·메모 저장
- 모바일/태블릿/데스크톱 반응형 UI
- Supabase RLS 기반 학생별 데이터 격리

관리자 계정 하나로 여러 학생의 컨설팅 데이터를 분리해 관리합니다. 실제 로그인과 영구 저장은 Supabase를 연결하면 활성화됩니다.

## Vercel 배포

1. 새 Supabase 프로젝트는 SQL Editor에서 `supabase/schema.sql`을 실행합니다. 기존 스키마를 이미 실행한 프로젝트는 `supabase/migrations/20260809_single_manager_students.sql`을 실행합니다.
2. Vercel 프로젝트에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 등록합니다.
3. 저장소를 Vercel에 연결해 배포합니다. `vercel.json`과 `vercel-build` 스크립트가 포함되어 있습니다.
4. Supabase Authentication에서 사용할 관리자 계정 하나를 생성합니다.

공개 회원가입은 제공하지 않으며, 로그인한 관리자가 앱 안에서 학생 기록을 직접 추가합니다.

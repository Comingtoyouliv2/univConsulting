# NOVA University Consulting

학생과 컨설턴트가 성적, 비교과 활동, 미팅 기록, 지원 관련 추가 정보를 함께 관리하는 대학 컨설팅 포털입니다.

## 포함 기능

- 학생 회원가입·로그인 및 학생/관리자 권한 분리
- 관리자 학생 목록, 검색, 학생별 진행 현황
- 고등학교/대학교 성적 CRUD
- 경력·비교과 활동 CRUD
- 컨설팅 미팅 기록 및 다음 액션 CRUD
- 지원 국가·전공·예산·시험·메모 저장
- 모바일/태블릿/데스크톱 반응형 UI
- Supabase RLS 기반 학생별 데이터 격리

환경 변수가 없으면 두 개의 체험 버튼으로 샘플 데이터를 사용할 수 있습니다. 실제 계정과 영구 저장은 Supabase를 연결하면 활성화됩니다.

## Vercel 배포

1. Supabase 프로젝트의 SQL Editor에서 `supabase/schema.sql`을 실행합니다.
2. Vercel 프로젝트에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 등록합니다.
3. 저장소를 Vercel에 연결해 배포합니다. `vercel.json`과 `vercel-build` 스크립트가 포함되어 있습니다.
4. 첫 관리자 계정을 학생 가입으로 만든 뒤, SQL 파일 마지막의 예시 쿼리로 해당 계정을 `admin`으로 승격합니다.

관리자 권한은 보안을 위해 공개 가입 화면에서 선택할 수 없습니다.

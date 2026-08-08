"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Role = "student" | "admin";
type Page = "dashboard" | "academic" | "activities" | "meetings" | "additional" | "students";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  school: string;
  graduation_year: string;
  target_major: string;
  progress: number;
  last_active: string;
};

type Grade = {
  id: string;
  student_id: string;
  level: "high_school" | "university";
  institution: string;
  term: string;
  course: string;
  grade: string;
};

type Experience = {
  id: string;
  student_id: string;
  category: string;
  title: string;
  organization: string;
  role: string;
  period: string;
  description: string;
};

type Meeting = {
  id: string;
  student_id: string;
  meeting_date: string;
  consultant: string;
  format: string;
  summary: string;
  next_steps: string;
};

type AdditionalInfo = {
  target_countries: string;
  target_major: string;
  application_round: string;
  budget: string;
  test_scores: string;
  notes: string;
};

type StudentBundle = {
  profile: Profile;
  grades: Grade[];
  experiences: Experience[];
  meetings: Meeting[];
  additional: AdditionalInfo;
};

const emptyAdditional: AdditionalInfo = {
  target_countries: "",
  target_major: "",
  application_round: "",
  budget: "",
  test_scores: "",
  notes: "",
};

const demoStudents: StudentBundle[] = [
  {
    profile: {
      id: "student-1",
      full_name: "김민준",
      email: "minjun.kim@example.com",
      role: "student",
      school: "Seoul Foreign School",
      graduation_year: "2027",
      target_major: "Computer Science",
      progress: 72,
      last_active: "오늘",
    },
    grades: [
      { id: "g1", student_id: "student-1", level: "high_school", institution: "Seoul Foreign School", term: "G11 · Semester 2", course: "AP Calculus BC", grade: "A" },
      { id: "g2", student_id: "student-1", level: "high_school", institution: "Seoul Foreign School", term: "G11 · Semester 2", course: "AP Computer Science A", grade: "A+" },
      { id: "g3", student_id: "student-1", level: "high_school", institution: "Seoul Foreign School", term: "G11 · Semester 1", course: "English Literature", grade: "A-" },
    ],
    experiences: [
      { id: "e1", student_id: "student-1", category: "Leadership", title: "Coding for All", organization: "교내 봉사 동아리", role: "Founder & President", period: "2025.03 — 현재", description: "지역 중학생을 위한 주말 코딩 수업을 기획하고 18명의 멘토를 운영합니다." },
      { id: "e2", student_id: "student-1", category: "Research", title: "AI Accessibility Research", organization: "Yonsei University Lab", role: "Student Researcher", period: "2025.06 — 2025.12", description: "시각장애인을 위한 이미지 설명 모델의 정확도 분석을 보조했습니다." },
    ],
    meetings: [
      { id: "m1", student_id: "student-1", meeting_date: "2026-08-05", consultant: "최유진 컨설턴트", format: "Zoom", summary: "Early Decision 대학 후보와 전공 적합성을 검토했습니다. 프로젝트 임팩트를 수치화해 활동 설명에 반영하기로 했습니다.", next_steps: "대학 5곳 커리큘럼 조사 · 활동 리스트 1차 수정" },
      { id: "m2", student_id: "student-1", meeting_date: "2026-07-22", consultant: "최유진 컨설턴트", format: "대면", summary: "Common App 에세이의 핵심 소재를 브레인스토밍하고 개인 성장 스토리를 선정했습니다.", next_steps: "에세이 아웃라인 작성 · 추천서 요청 대상 확정" },
    ],
    additional: {
      target_countries: "미국, 캐나다",
      target_major: "Computer Science / Human-Computer Interaction",
      application_round: "Early Decision · Regular Decision",
      budget: "연간 USD 70,000 이내",
      test_scores: "SAT 1510 · TOEFL 112 · AP 5과목",
      notes: "도시형 캠퍼스를 선호하며, 학부 연구와 창업 지원이 강한 학교를 우선 검토. 재정보조 신청 예정.",
    },
  },
  {
    profile: { id: "student-2", full_name: "이서연", email: "seoyeon.lee@example.com", role: "student", school: "Korea International School", graduation_year: "2027", target_major: "Economics", progress: 58, last_active: "어제" },
    grades: [], experiences: [], meetings: [], additional: { ...emptyAdditional, target_major: "Economics", target_countries: "미국, 영국" },
  },
  {
    profile: { id: "student-3", full_name: "박지호", email: "jiho.park@example.com", role: "student", school: "Branksome Hall Asia", graduation_year: "2028", target_major: "Biology", progress: 41, last_active: "3일 전" },
    grades: [], experiences: [], meetings: [], additional: { ...emptyAdditional, target_major: "Biology / Pre-med", target_countries: "미국" },
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "students", label: "학생 관리", icon: UsersRound, adminOnly: true },
  { id: "academic", label: "성적표", icon: GraduationCap },
  { id: "activities", label: "경력 · 활동", icon: Sparkles },
  { id: "meetings", label: "미팅 기록", icon: MessageSquareText },
  { id: "additional", label: "추가 정보", icon: FileText },
];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export function PortalApp() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [session, setSession] = useState<{ role: Role; userId: string; name: string } | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState<StudentBundle[]>(demoStudents);
  const [selectedId, setSelectedId] = useState("student-1");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const selected = students.find((student) => student.profile.id === selectedId) ?? students[0];
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.session.user.id).single();
      if (profile) {
        setSession({ role: profile.role, userId: profile.id, name: profile.full_name });
        await loadFromSupabase(profile.role, profile.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadFromSupabase(role: Role, userId: string) {
    if (!supabase) return;
    const profileQuery = role === "admin" ? supabase.from("profiles").select("*").eq("role", "student") : supabase.from("profiles").select("*").eq("id", userId);
    const { data: profiles } = await profileQuery;
    if (!profiles?.length) return;
    const ids = profiles.map((profile) => profile.id);
    const [{ data: grades }, { data: experiences }, { data: meetings }, { data: additional }] = await Promise.all([
      supabase.from("grades").select("*").in("student_id", ids).order("created_at", { ascending: false }),
      supabase.from("experiences").select("*").in("student_id", ids).order("created_at", { ascending: false }),
      supabase.from("meeting_notes").select("*").in("student_id", ids).order("meeting_date", { ascending: false }),
      supabase.from("additional_info").select("*").in("student_id", ids),
    ]);
    const bundles = profiles.map((profile) => ({
      profile,
      grades: grades?.filter((item) => item.student_id === profile.id) ?? [],
      experiences: experiences?.filter((item) => item.student_id === profile.id) ?? [],
      meetings: meetings?.filter((item) => item.student_id === profile.id) ?? [],
      additional: additional?.find((item) => item.student_id === profile.id) ?? { ...emptyAdditional },
    }));
    setStudents(bundles);
    setSelectedId(role === "student" ? userId : bundles[0].profile.id);
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const passwordConfirm = String(data.get("passwordConfirm") ?? "");
    const fullName = String(data.get("fullName") ?? "").trim();
    setAuthMessage("");

    if (!supabase) {
      setAuthMessage("계정 서버 연결이 필요합니다. 관리자에게 문의해 주세요.");
      return;
    }

    if (authMode === "signup" && password !== passwordConfirm) {
      setAuthMessage("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { data: signUp, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) {
          setAuthMessage(error.message.includes("already registered") ? "이미 가입된 이메일입니다." : "회원가입을 완료하지 못했습니다. 입력 내용을 확인해 주세요.");
        } else if (!signUp.session) {
          setAuthMessage("가입 확인 이메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.");
        } else if (signUp.user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", signUp.user.id).single();
          if (profile) {
            setSession({ role: profile.role, userId: profile.id, name: profile.full_name });
            await loadFromSupabase(profile.role, profile.id);
          }
        }
        return;
      }

      const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !signIn.user) {
        setAuthMessage("이메일 또는 비밀번호를 확인해 주세요.");
      } else {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", signIn.user.id).single();
        if (!profile) {
          await supabase.auth.signOut();
          setAuthMessage("등록된 사용자 정보를 찾을 수 없습니다. 관리자에게 문의해 주세요.");
        } else {
          setSession({ role: profile.role, userId: profile.id, name: profile.full_name });
          await loadFromSupabase(profile.role, profile.id);
        }
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setPage("dashboard");
  }

  async function addRecord(table: "grades" | "experiences" | "meeting_notes", record: Record<string, string>) {
    const localRecord = { ...record, id: uid(table), student_id: selected.profile.id };
    let savedRecord = localRecord;
    if (supabase) {
      const { data, error } = await supabase.from(table).insert({ ...record, student_id: selected.profile.id }).select().single();
      if (error) {
        setToast("저장 중 문제가 발생했습니다.");
        return;
      }
      savedRecord = data;
    }
    setStudents((current) => current.map((student) => student.profile.id !== selected.profile.id ? student : {
      ...student,
      grades: table === "grades" ? [savedRecord as Grade, ...student.grades] : student.grades,
      experiences: table === "experiences" ? [savedRecord as Experience, ...student.experiences] : student.experiences,
      meetings: table === "meeting_notes" ? [savedRecord as Meeting, ...student.meetings] : student.meetings,
    }));
    setToast("안전하게 저장했습니다.");
  }

  async function deleteRecord(table: "grades" | "experiences" | "meeting_notes", id: string) {
    if (supabase) await supabase.from(table).delete().eq("id", id);
    setStudents((current) => current.map((student) => student.profile.id !== selected.profile.id ? student : {
      ...student,
      grades: table === "grades" ? student.grades.filter((item) => item.id !== id) : student.grades,
      experiences: table === "experiences" ? student.experiences.filter((item) => item.id !== id) : student.experiences,
      meetings: table === "meeting_notes" ? student.meetings.filter((item) => item.id !== id) : student.meetings,
    }));
    setToast("항목을 삭제했습니다.");
  }

  async function saveAdditional(info: AdditionalInfo) {
    if (supabase) {
      const { error } = await supabase.from("additional_info").upsert({ student_id: selected.profile.id, ...info }, { onConflict: "student_id" });
      if (error) {
        setToast("저장 중 문제가 발생했습니다.");
        return;
      }
    }
    setStudents((current) => current.map((student) => student.profile.id === selected.profile.id ? { ...student, additional: info } : student));
    setToast("추가 정보를 저장했습니다.");
  }

  if (!session) {
    return <AuthScreen mode={authMode} onModeChange={(mode) => { setAuthMode(mode); setAuthMessage(""); }} onSubmit={handleAuth} message={authMessage} loading={authLoading} />;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">N</div>
          <div><strong>NOVA</strong><span>UNIVERSITY CONSULTING</span></div>
          <button className="sidebar-close icon-button" onClick={() => setSidebarOpen(false)} aria-label="메뉴 닫기"><X size={20} /></button>
        </div>
        <nav className="main-nav" aria-label="주요 메뉴">
          <p className="nav-label">WORKSPACE</p>
          {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => { setPage(item.id); setSidebarOpen(false); }}>
              <item.icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
              {item.id === "meetings" && selected.meetings.length > 0 && <em>{selected.meetings.length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button><Settings size={18} /><span>설정</span></button>
          <div className="account-mini">
            <div className="avatar">{session.name.slice(0, 1)}</div>
            <div><strong>{session.name}</strong><span>{isAdmin ? "Senior Consultant" : "Student"}</span></div>
            <button onClick={logout} aria-label="로그아웃"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="메뉴 닫기" />}

      <main className="main-panel">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setSidebarOpen(true)} aria-label="메뉴 열기"><Menu size={21} /></button>
          <div className="student-context">
            <span>{isAdmin ? "관리 학생" : "내 프로필"}</span>
            <button onClick={() => isAdmin && setPage("students")}>
              <div className="avatar small">{selected.profile.full_name.slice(0, 1)}</div>
              <strong>{selected.profile.full_name}</strong>
              {isAdmin && <ChevronDown size={16} />}
            </button>
          </div>
          <div className="top-actions">
            <label className="global-search"><Search size={17} /><input placeholder="학생 또는 기록 검색" aria-label="검색" /></label>
            <button className="icon-button has-dot" aria-label="알림"><Bell size={20} /></button>
            <span className={`role-pill ${isAdmin ? "admin" : "student"}`}>{isAdmin ? "ADMIN" : "STUDENT"}</span>
          </div>
        </header>

        <div className="content-wrap">
          {page === "dashboard" && <Dashboard student={selected} isAdmin={isAdmin} onNavigate={setPage} />}
          {page === "students" && isAdmin && <StudentsPage students={students} selectedId={selectedId} search={search} setSearch={setSearch} onSelect={(id) => { setSelectedId(id); setPage("dashboard"); }} />}
          {page === "academic" && <AcademicPage student={selected} onAdd={(record) => addRecord("grades", record)} onDelete={(id) => deleteRecord("grades", id)} />}
          {page === "activities" && <ActivitiesPage student={selected} onAdd={(record) => addRecord("experiences", record)} onDelete={(id) => deleteRecord("experiences", id)} />}
          {page === "meetings" && <MeetingsPage student={selected} onAdd={(record) => addRecord("meeting_notes", record)} onDelete={(id) => deleteRecord("meeting_notes", id)} />}
          {page === "additional" && <AdditionalPage student={selected} onSave={saveAdditional} />}
        </div>
      </main>
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

function AuthScreen({ mode, onModeChange, onSubmit, message, loading }: {
  mode: "login" | "signup"; onModeChange: (mode: "login" | "signup") => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; message: string; loading: boolean;
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand"><div className="brand-mark">N</div><div><strong>NOVA</strong><span>UNIVERSITY CONSULTING</span></div></div>
        <div className="auth-heading">
          <h1>{mode === "login" ? "로그인" : "회원가입"}</h1>
        </div>
        <form onSubmit={onSubmit} className="auth-form">
          {mode === "signup" && <label>이름<input name="fullName" required placeholder="이름을 입력하세요" autoComplete="name" /></label>}
          <label>이메일<input name="email" type="email" required placeholder="name@example.com" autoComplete="email" /></label>
          <label>비밀번호<input name="password" type="password" required minLength={8} placeholder="8자 이상 입력하세요" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
          {mode === "signup" && <label>비밀번호 확인<input name="passwordConfirm" type="password" required minLength={8} placeholder="비밀번호를 다시 입력하세요" autoComplete="new-password" /></label>}
          {message && <p className="auth-message">{message}</p>}
          <button className="primary-button auth-submit" disabled={loading}>{loading ? "확인 중..." : mode === "login" ? "로그인" : "학생 계정 만들기"}<ArrowRight size={18} /></button>
        </form>
        <p className="auth-switch">
          {mode === "login" ? "아직 계정이 없으신가요?" : "이미 계정이 있으신가요?"}
          <button type="button" onClick={() => onModeChange(mode === "login" ? "signup" : "login")}>{mode === "login" ? "회원가입" : "로그인"}</button>
        </p>
      </div>
    </div>
  );
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-intro"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Dashboard({ student, isAdmin, onNavigate }: { student: StudentBundle; isAdmin: boolean; onNavigate: (page: Page) => void }) {
  const initials = student.profile.full_name.slice(0, 1);
  return (
    <>
      <section className="dashboard-hero">
        <div className="hero-avatar">{initials}</div>
        <div className="hero-main">
          <span className="eyebrow">{isAdmin ? "STUDENT OVERVIEW" : "MY APPLICATION JOURNEY"}</span>
          <h1>{student.profile.full_name} <em>학생의 여정</em></h1>
          <p>{student.profile.school} · Class of {student.profile.graduation_year} · {student.profile.target_major}</p>
        </div>
        <div className="progress-block">
          <div><span>PROFILE COMPLETION</span><strong>{student.profile.progress}%</strong></div>
          <div className="progress-track"><i style={{ width: `${student.profile.progress}%` }} /></div>
          <small>좋아요! 활동 상세 내용을 조금 더 채워주세요.</small>
        </div>
      </section>

      <div className="metric-grid">
        <Metric icon={GraduationCap} value={student.grades.length || 0} label="등록된 성적" note="Course records" onClick={() => onNavigate("academic")} tone="navy" />
        <Metric icon={Sparkles} value={student.experiences.length || 0} label="경력 · 활동" note="Experiences" onClick={() => onNavigate("activities")} tone="orange" />
        <Metric icon={MessageSquareText} value={student.meetings.length || 0} label="미팅 기록" note="Consulting notes" onClick={() => onNavigate("meetings")} tone="green" />
        <Metric icon={FileText} value={student.additional.target_countries ? 5 : 0} label="추가 정보" note="Personal details" onClick={() => onNavigate("additional")} tone="sand" />
      </div>

      <div className="dashboard-grid">
        <section className="panel next-step-panel">
          <div className="panel-heading"><div><span>PRIORITY</span><h2>다음 할 일</h2></div><button><MoreHorizontal size={20} /></button></div>
          <div className="task-list">
            <label><input type="checkbox" /><span><strong>활동 리스트 1차 수정</strong><small>오늘까지 · 활동 설명에 임팩트 수치 추가</small></span><em>HIGH</em></label>
            <label><input type="checkbox" /><span><strong>대학별 커리큘럼 조사</strong><small>8월 12일까지 · 5개 대학</small></span><em className="medium">MED</em></label>
            <label><input type="checkbox" /><span><strong>에세이 아웃라인 작성</strong><small>8월 16일까지 · Common App</small></span><em className="low">NEXT</em></label>
          </div>
        </section>
        <section className="panel meeting-preview">
          <div className="panel-heading"><div><span>RECENT NOTES</span><h2>최근 미팅</h2></div><button className="text-button" onClick={() => onNavigate("meetings")}>전체 보기 <ArrowRight size={15} /></button></div>
          {student.meetings[0] ? <div className="meeting-card"><div className="date-tile"><strong>{new Date(student.meetings[0].meeting_date).getDate()}</strong><span>{new Date(student.meetings[0].meeting_date).toLocaleString("en", { month: "short" }).toUpperCase()}</span></div><div><span>{student.meetings[0].format} · {student.meetings[0].consultant}</span><p>{student.meetings[0].summary}</p><small><Check size={13} /> {student.meetings[0].next_steps}</small></div></div> : <EmptyState label="아직 저장된 미팅 기록이 없습니다." />}
        </section>
      </div>
    </>
  );
}

function Metric({ icon: Icon, value, label, note, onClick, tone }: { icon: typeof Activity; value: number; label: string; note: string; onClick: () => void; tone: string }) {
  return <button className={`metric-card ${tone}`} onClick={onClick}><div className="metric-icon"><Icon size={22} /></div><div><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span><small>{note}</small></div><ArrowRight className="metric-arrow" size={18} /></button>;
}

function StudentsPage({ students, selectedId, search, setSearch, onSelect }: { students: StudentBundle[]; selectedId: string; search: string; setSearch: (value: string) => void; onSelect: (id: string) => void }) {
  const filtered = students.filter((student) => `${student.profile.full_name} ${student.profile.email} ${student.profile.school}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageIntro eyebrow="STUDENT DIRECTORY" title="학생 관리" description="담당 학생의 준비 현황을 한눈에 확인하고 기록으로 이동하세요." action={<button className="primary-button"><Plus size={17} />학생 초대</button>} /><section className="panel student-directory"><div className="directory-toolbar"><label><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="이름, 이메일, 학교로 검색" /></label><span>전체 {students.length}명</span></div><div className="student-table"><div className="student-row table-head"><span>학생</span><span>목표 전공</span><span>졸업 연도</span><span>진행률</span><span>최근 활동</span><span /></div>{filtered.map((student) => <button className={`student-row ${student.profile.id === selectedId ? "selected" : ""}`} key={student.profile.id} onClick={() => onSelect(student.profile.id)}><span className="student-cell"><i>{student.profile.full_name.slice(0, 1)}</i><span><strong>{student.profile.full_name}</strong><small>{student.profile.email}</small></span></span><span>{student.profile.target_major}</span><span>{student.profile.graduation_year}</span><span className="row-progress"><i><b style={{ width: `${student.profile.progress}%` }} /></i>{student.profile.progress}%</span><span>{student.profile.last_active}</span><span><ArrowRight size={17} /></span></button>)}</div></section></>;
}

function AcademicPage({ student, onAdd, onDelete }: { student: StudentBundle; onAdd: (record: Record<string, string>) => void; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>; onAdd(data); event.currentTarget.reset(); setOpen(false); }
  return <><PageIntro eyebrow="ACADEMIC RECORD" title="성적표" description="고등학교와 대학교 이수 과목을 학기별로 정리하세요." action={<button className="primary-button" onClick={() => setOpen(!open)}><Plus size={17} />성적 추가</button>} />{open && <RecordForm title="새 성적 등록" onClose={() => setOpen(false)} onSubmit={submit}><label>구분<select name="level"><option value="high_school">고등학교</option><option value="university">대학교 / Dual Enrollment</option></select></label><label>학교명<input name="institution" required placeholder="학교명을 입력하세요" /></label><label>학기<input name="term" required placeholder="예: G11 · Semester 2" /></label><label>과목명<input name="course" required placeholder="예: AP Calculus BC" /></label><label>성적<input name="grade" required placeholder="예: A+ 또는 4.0" /></label></RecordForm>}<section className="panel records-panel"><div className="record-summary"><div><BarChart3 size={22} /><span><strong>{student.grades.length}</strong>개 과목 등록</span></div><p>최근 업데이트 · 오늘</p></div><div className="grade-list">{student.grades.length ? student.grades.map((grade) => <div className="grade-row" key={grade.id}><div className="course-icon"><BookOpen size={19} /></div><div className="course-main"><span>{grade.level === "high_school" ? "HIGH SCHOOL" : "UNIVERSITY"}</span><strong>{grade.course}</strong><small>{grade.institution} · {grade.term}</small></div><b>{grade.grade}</b><button onClick={() => onDelete(grade.id)} aria-label={`${grade.course} 삭제`}><Trash2 size={17} /></button></div>) : <EmptyState label="첫 성적을 등록해 학업 기록을 시작하세요." />}</div></section></>;
}

function ActivitiesPage({ student, onAdd, onDelete }: { student: StudentBundle; onAdd: (record: Record<string, string>) => void; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>; onAdd(data); event.currentTarget.reset(); setOpen(false); }
  return <><PageIntro eyebrow="EXPERIENCE & EXTRACURRICULAR" title="경력 · 활동" description="교내외 활동, 수상, 연구, 봉사 경험을 이야기로 축적하세요." action={<button className="primary-button" onClick={() => setOpen(!open)}><Plus size={17} />활동 추가</button>} />{open && <RecordForm title="새 활동 등록" onClose={() => setOpen(false)} onSubmit={submit} wide><label>분류<select name="category"><option>Leadership</option><option>Research</option><option>Community Service</option><option>Award</option><option>Internship</option><option>Art & Sports</option></select></label><label>활동명<input name="title" required placeholder="활동 또는 프로젝트 이름" /></label><label>기관 / 단체<input name="organization" required placeholder="소속 기관" /></label><label>역할<input name="role" required placeholder="예: Founder & President" /></label><label>기간<input name="period" required placeholder="2025.03 — 현재" /></label><label className="full-field">상세 설명<textarea name="description" required rows={4} placeholder="무엇을 했고 어떤 변화를 만들었는지 구체적으로 작성하세요." /></label></RecordForm>}<div className="activity-grid">{student.experiences.length ? student.experiences.map((item, index) => <article className="activity-card" key={item.id}><div className="activity-number">0{index + 1}</div><div className="activity-top"><span>{item.category.toUpperCase()}</span><button onClick={() => onDelete(item.id)} aria-label={`${item.title} 삭제`}><Trash2 size={16} /></button></div><h3>{item.title}</h3><p className="activity-role">{item.role} · {item.organization}</p><p>{item.description}</p><div className="activity-period"><CalendarDays size={15} />{item.period}</div></article>) : <section className="panel"><EmptyState label="첫 활동을 추가해 나만의 이야기를 쌓아보세요." /></section>}</div></>;
}

function MeetingsPage({ student, onAdd, onDelete }: { student: StudentBundle; onAdd: (record: Record<string, string>) => void; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>; onAdd(data); event.currentTarget.reset(); setOpen(false); }
  return <><PageIntro eyebrow="CONSULTING LOG" title="미팅 기록" description="상담 내용과 다음 액션을 시간순으로 남겨 흐름을 놓치지 마세요." action={<button className="primary-button" onClick={() => setOpen(!open)}><Plus size={17} />미팅 기록</button>} />{open && <RecordForm title="새 미팅 기록" onClose={() => setOpen(false)} onSubmit={submit} wide><label>미팅 날짜<input type="date" name="meeting_date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label><label>담당 컨설턴트<input name="consultant" required placeholder="컨설턴트 이름" /></label><label>진행 방식<select name="format"><option>Zoom</option><option>대면</option><option>전화</option><option>이메일</option></select></label><label className="full-field">미팅 요약<textarea name="summary" required rows={4} placeholder="논의한 핵심 내용을 작성하세요." /></label><label className="full-field">다음 할 일<textarea name="next_steps" required rows={3} placeholder="학생과 컨설턴트의 후속 액션을 작성하세요." /></label></RecordForm>}<section className="meeting-timeline">{student.meetings.length ? student.meetings.map((meeting, index) => <article className="timeline-item" key={meeting.id}><div className="timeline-rail"><i>{index + 1}</i></div><div className="panel timeline-card"><div className="timeline-meta"><span>{formatDate(meeting.meeting_date)}</span><em>{meeting.format}</em><button onClick={() => onDelete(meeting.id)} aria-label="미팅 기록 삭제"><Trash2 size={16} /></button></div><h3>{meeting.consultant}와의 미팅</h3><p>{meeting.summary}</p><div className="next-actions"><span>NEXT ACTIONS</span><strong><Check size={15} />{meeting.next_steps}</strong></div></div></article>) : <section className="panel"><EmptyState label="첫 미팅 기록을 남겨 상담 흐름을 관리하세요." /></section>}</section></>;
}

function AdditionalPage({ student, onSave }: { student: StudentBundle; onSave: (info: AdditionalInfo) => void }) {
  const [info, setInfo] = useState(student.additional);
  useEffect(() => setInfo(student.additional), [student.profile.id, student.additional]);
  function change(field: keyof AdditionalInfo, value: string) { setInfo((current) => ({ ...current, [field]: value })); }
  return <><PageIntro eyebrow="PERSONAL CONTEXT" title="추가 정보" description="지원 전략을 더 정교하게 만드는 개인 선호와 조건을 정리하세요." /><form className="panel additional-form" onSubmit={(event) => { event.preventDefault(); onSave(info); }}><div className="form-section"><div className="form-section-heading"><span>01</span><div><h3>지원 목표</h3><p>희망 지역과 전공, 지원 시기를 입력해 주세요.</p></div></div><div className="fields-grid"><label>희망 국가<input value={info.target_countries} onChange={(e) => change("target_countries", e.target.value)} placeholder="예: 미국, 캐나다" /></label><label>희망 전공<input value={info.target_major} onChange={(e) => change("target_major", e.target.value)} placeholder="예: Computer Science" /></label><label className="full-field">지원 라운드<input value={info.application_round} onChange={(e) => change("application_round", e.target.value)} placeholder="예: Early Decision, Regular Decision" /></label></div></div><div className="form-section"><div className="form-section-heading"><span>02</span><div><h3>조건과 시험</h3><p>예산 범위와 공인 시험 현황을 기록하세요.</p></div></div><div className="fields-grid"><label>연간 예산<input value={info.budget} onChange={(e) => change("budget", e.target.value)} placeholder="학비 및 생활비 기준" /></label><label>공인 시험 성적<input value={info.test_scores} onChange={(e) => change("test_scores", e.target.value)} placeholder="SAT, TOEFL, AP 등" /></label></div></div><div className="form-section"><div className="form-section-heading"><span>03</span><div><h3>상세 메모</h3><p>학교 선호, 가족 요청, 유의사항을 자유롭게 남기세요.</p></div></div><div className="fields-grid"><label className="full-field">추가 메모<textarea rows={6} value={info.notes} onChange={(e) => change("notes", e.target.value)} placeholder="컨설팅에 참고할 추가 정보를 입력하세요." /></label></div></div><div className="form-actions"><span><Check size={15} />입력 정보는 계정 권한에 따라 안전하게 관리됩니다.</span><button className="primary-button" type="submit">변경사항 저장</button></div></form></>;
}

function RecordForm({ title, children, onClose, onSubmit, wide }: { title: string; children: React.ReactNode; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; wide?: boolean }) {
  return <section className="panel record-form-panel"><div className="record-form-head"><div><span>NEW RECORD</span><h2>{title}</h2></div><button onClick={onClose} aria-label="닫기"><X size={19} /></button></div><form onSubmit={onSubmit} className={`record-form ${wide ? "wide" : ""}`}>{children}<div className="record-form-actions"><button type="button" onClick={onClose}>취소</button><button className="primary-button" type="submit">저장하기</button></div></form></section>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="empty-state"><CircleUserRound size={30} /><p>{label}</p></div>;
}

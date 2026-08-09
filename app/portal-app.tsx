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
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
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
  credit_hours: number | string;
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
  const [session, setSession] = useState<{ role: Role; userId: string; name: string } | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState<StudentBundle[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const studentMenuRef = useRef<HTMLDivElement>(null);

  const selected = students.find((student) => student.profile.id === selectedId) ?? students[0];
  const isAdmin = Boolean(session);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.session.user.id).single();
      if (profile) {
        setSession({ role: "admin", userId: profile.id, name: profile.full_name });
        await loadFromSupabase(profile.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!studentMenuOpen) return;
    function closeStudentMenu(event: MouseEvent) {
      if (!studentMenuRef.current?.contains(event.target as Node)) setStudentMenuOpen(false);
    }
    function closeStudentMenuWithKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") setStudentMenuOpen(false);
    }
    document.addEventListener("mousedown", closeStudentMenu);
    document.addEventListener("keydown", closeStudentMenuWithKeyboard);
    return () => {
      document.removeEventListener("mousedown", closeStudentMenu);
      document.removeEventListener("keydown", closeStudentMenuWithKeyboard);
    };
  }, [studentMenuOpen]);

  async function loadFromSupabase(userId: string) {
    if (!supabase) return;
    const { data: studentRows, error: studentError } = await supabase.from("students").select("*").eq("owner_id", userId).order("created_at", { ascending: true });
    if (studentError) {
      console.error("Failed to load students", studentError);
      setStudents([]);
      setSelectedId("");
      setPage("students");
      setToast("학생 DB 연결을 확인해 주세요. 샘플 데이터는 표시하지 않습니다.");
      return;
    }
    if (!studentRows?.length) {
      setStudents([]);
      setSelectedId("");
      setPage("students");
      return;
    }
    const ids = studentRows.map((student) => student.id);
    const [{ data: grades }, { data: experiences }, { data: meetings }, { data: additional }] = await Promise.all([
      supabase.from("grades").select("*").in("student_id", ids).order("created_at", { ascending: false }),
      supabase.from("experiences").select("*").in("student_id", ids).order("created_at", { ascending: false }),
      supabase.from("meeting_notes").select("*").in("student_id", ids).order("meeting_date", { ascending: false }),
      supabase.from("additional_info").select("*").in("student_id", ids),
    ]);
    const bundles = studentRows.map((student) => ({
      profile: { ...student, role: "student" as Role, last_active: "최근" },
      grades: grades?.filter((item) => item.student_id === student.id) ?? [],
      experiences: experiences?.filter((item) => item.student_id === student.id) ?? [],
      meetings: meetings?.filter((item) => item.student_id === student.id) ?? [],
      additional: additional?.find((item) => item.student_id === student.id) ?? { ...emptyAdditional },
    }));
    setStudents(bundles);
    setSelectedId((current) => bundles.some((student) => student.profile.id === current) ? current : bundles[0].profile.id);
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    setAuthMessage("");

    if (!supabase) {
      setAuthMessage("계정 서버 연결이 필요합니다. 관리자에게 문의해 주세요.");
      return;
    }

    setAuthLoading(true);
    try {
      const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !signIn.user) {
        setAuthMessage("이메일 또는 비밀번호를 확인해 주세요.");
      } else {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", signIn.user.id).single();
        if (!profile) {
          await supabase.auth.signOut();
          setAuthMessage("등록된 사용자 정보를 찾을 수 없습니다. 관리자에게 문의해 주세요.");
        } else {
          setSession({ role: "admin", userId: profile.id, name: profile.full_name });
          await loadFromSupabase(profile.id);
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

  async function addStudent(record: Record<string, string>) {
    if (!session) return;
    const payload = {
      owner_id: session.userId,
      full_name: record.full_name,
      email: record.email || "",
      school: record.school || "",
      graduation_year: record.graduation_year || "",
      target_major: record.target_major || "",
      progress: 10,
    };
    let saved = { ...payload, id: uid("student") };
    if (supabase) {
      const { data, error } = await supabase.from("students").insert(payload).select().single();
      if (error) {
        setToast("학생을 추가하지 못했습니다. 데이터베이스 설정을 확인해 주세요.");
        return;
      }
      saved = data;
    }
    const bundle: StudentBundle = {
      profile: { ...saved, role: "student", last_active: "방금 전" },
      grades: [],
      experiences: [],
      meetings: [],
      additional: { ...emptyAdditional, target_major: saved.target_major },
    };
    setStudents((current) => [...current, bundle]);
    setSelectedId(saved.id);
    setPage("dashboard");
    setToast(`${saved.full_name} 학생을 추가했습니다.`);
  }

  async function updateStudent(studentId: string, record: Record<string, string>) {
    const changes = {
      full_name: record.full_name,
      email: record.email || "",
      school: record.school || "",
      graduation_year: record.graduation_year || "",
      target_major: record.target_major || "",
      last_active: new Date().toISOString(),
    };
    if (supabase) {
      const { error } = await supabase.from("students").update(changes).eq("id", studentId);
      if (error) {
        setToast("학생 정보를 수정하지 못했습니다.");
        return;
      }
    }
    setStudents((current) => current.map((student) => student.profile.id === studentId ? {
      ...student,
      profile: { ...student.profile, ...changes, last_active: "방금 전" },
    } : student));
    setToast(`${changes.full_name} 학생 정보를 수정했습니다.`);
  }

  async function deleteStudent(studentId: string): Promise<boolean> {
    const target = students.find((student) => student.profile.id === studentId);
    if (!target) return false;
    if (supabase) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(studentId)) {
        if (session) await loadFromSupabase(session.userId);
        setToast("샘플 학생을 제거하고 실제 DB 목록을 불러왔습니다.");
        return true;
      }

      const rpcResult = await supabase.rpc("delete_managed_student", { target_student_id: studentId });
      if (rpcResult.error?.code === "PGRST202") {
        const fallback = await supabase.from("students").delete().eq("id", studentId).eq("owner_id", session?.userId ?? "");
        if (fallback.error) {
          console.error("Failed to delete student", fallback.error);
          setToast(fallback.error.code === "23503" ? "관련 기록의 삭제 설정을 먼저 업데이트해 주세요." : "학생 삭제 권한을 확인해 주세요.");
          return false;
        }
      } else if (rpcResult.error) {
        console.error("Failed to delete student", rpcResult.error);
        setToast("학생 삭제 권한을 확인해 주세요.");
        return false;
      } else if (rpcResult.data !== true) {
        setToast("삭제할 학생을 찾지 못했거나 권한이 없습니다.");
        return false;
      }
    }
    const remaining = students.filter((student) => student.profile.id !== studentId);
    setStudents(remaining);
    if (selectedId === studentId) setSelectedId(remaining[0]?.profile.id ?? "");
    setPage("students");
    setToast(`${target.profile.full_name} 학생과 관련 기록을 삭제했습니다.`);
    return true;
  }

  async function addRecord(table: "grades" | "experiences" | "meeting_notes", record: Record<string, string>) {
    if (!selected) return;
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
    if (!selected) return;
    if (supabase) await supabase.from(table).delete().eq("id", id);
    setStudents((current) => current.map((student) => student.profile.id !== selected.profile.id ? student : {
      ...student,
      grades: table === "grades" ? student.grades.filter((item) => item.id !== id) : student.grades,
      experiences: table === "experiences" ? student.experiences.filter((item) => item.id !== id) : student.experiences,
      meetings: table === "meeting_notes" ? student.meetings.filter((item) => item.id !== id) : student.meetings,
    }));
    setToast("항목을 삭제했습니다.");
  }

  async function updateGrade(gradeId: string, record: Record<string, string>): Promise<boolean> {
    if (!selected) return false;
    const changes = {
      level: record.level,
      institution: record.institution,
      term: record.term,
      course: record.course,
      grade: record.grade,
      credit_hours: Number(record.credit_hours || 1),
    };
    if (supabase) {
      const { error } = await supabase.from("grades").update(changes).eq("id", gradeId).eq("student_id", selected.profile.id);
      if (error) {
        console.error("Failed to update grade", error);
        setToast("성적을 수정하지 못했습니다.");
        return false;
      }
    }
    setStudents((current) => current.map((student) => student.profile.id !== selected.profile.id ? student : {
      ...student,
      grades: student.grades.map((grade) => grade.id === gradeId ? { ...grade, ...changes } as Grade : grade),
    }));
    setToast("성적 정보를 수정했습니다.");
    return true;
  }

  async function saveAdditional(info: AdditionalInfo) {
    if (!selected) return;
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
    return <AuthScreen onSubmit={handleAuth} message={authMessage} loading={authLoading} />;
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
              {item.id === "meetings" && selected && selected.meetings.length > 0 && <em>{selected.meetings.length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="account-mini">
            <div className="avatar">{session.name.slice(0, 1)}</div>
            <div><strong>{session.name}</strong><span>통합 관리자</span></div>
            <button onClick={logout} aria-label="로그아웃"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="메뉴 닫기" />}

      <main className="main-panel">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setSidebarOpen(true)} aria-label="메뉴 열기"><Menu size={21} /></button>
          <div className="student-context" ref={studentMenuRef}>
            <span>관리 학생</span>
            <button className="student-switcher-trigger" onClick={() => setStudentMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={studentMenuOpen}>
              <div className="avatar small">{selected ? selected.profile.full_name.slice(0, 1) : "+"}</div>
              <strong>{selected ? selected.profile.full_name : "학생을 추가해 주세요"}</strong>
              <ChevronDown className={studentMenuOpen ? "open" : ""} size={16} />
            </button>
            {studentMenuOpen && <div className="student-switcher-menu" role="menu" aria-label="관리 학생 선택">
              <div className="student-switcher-head"><div><span>MANAGED STUDENTS</span><strong>관리 학생 선택</strong></div><button onClick={() => { setStudentMenuOpen(false); setPage("students"); }}>전체 관리</button></div>
              <div className="student-switcher-list">
                {students.length ? students.map((student) => <button key={student.profile.id} role="menuitemradio" aria-checked={student.profile.id === selectedId} className={student.profile.id === selectedId ? "active" : ""} onClick={() => { setSelectedId(student.profile.id); setStudentMenuOpen(false); if (page === "students") setPage("dashboard"); }}>
                  <i>{student.profile.full_name.slice(0, 1)}</i>
                  <span><strong>{student.profile.full_name}</strong><small>{student.profile.school || student.profile.target_major || "학생 정보"}</small></span>
                  {student.profile.id === selectedId && <Check size={16} />}
                </button>) : <p>등록된 학생이 없습니다.</p>}
              </div>
              <button className="student-switcher-add" onClick={() => { setStudentMenuOpen(false); setPage("students"); }}><Plus size={15} />학생 추가 및 관리</button>
            </div>}
          </div>
          <div className="top-actions">
            <label className="global-search"><Search size={17} /><input placeholder="학생 또는 기록 검색" aria-label="검색" /></label>
            <button className="icon-button has-dot" aria-label="알림"><Bell size={20} /></button>
            <span className="role-pill admin">MANAGER</span>
          </div>
        </header>

        <div className="content-wrap">
          {page === "students" && <StudentsPage students={students} selectedId={selectedId} search={search} setSearch={setSearch} onAdd={addStudent} onUpdate={updateStudent} onDelete={deleteStudent} onSelect={(id) => { setSelectedId(id); setPage("dashboard"); }} />}
          {selected ? <>
            {page === "dashboard" && <Dashboard student={selected} isAdmin onNavigate={setPage} />}
            {page === "academic" && <AcademicPage student={selected} onAdd={(record) => addRecord("grades", record)} onUpdate={updateGrade} onDelete={(id) => deleteRecord("grades", id)} />}
            {page === "activities" && <ActivitiesPage student={selected} onAdd={(record) => addRecord("experiences", record)} onDelete={(id) => deleteRecord("experiences", id)} />}
            {page === "meetings" && <MeetingsPage student={selected} onAdd={(record) => addRecord("meeting_notes", record)} onDelete={(id) => deleteRecord("meeting_notes", id)} />}
            {page === "additional" && <AdditionalPage student={selected} onSave={saveAdditional} />}
          </> : page !== "students" && <NoStudentState onAdd={() => setPage("students")} />}
        </div>
      </main>
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

function AuthScreen({ onSubmit, message, loading }: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; message: string; loading: boolean;
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand"><div className="brand-mark">N</div><div><strong>NOVA</strong><span>UNIVERSITY CONSULTING</span></div></div>
        <div className="auth-heading">
          <h1>로그인</h1>
        </div>
        <form onSubmit={onSubmit} className="auth-form">
          <label>이메일<input name="email" type="email" required placeholder="name@example.com" autoComplete="email" /></label>
          <label>비밀번호<input name="password" type="password" required minLength={8} placeholder="비밀번호를 입력하세요" autoComplete="current-password" /></label>
          {message && <p className="auth-message">{message}</p>}
          <button className="primary-button auth-submit" disabled={loading}>{loading ? "확인 중..." : "로그인"}<ArrowRight size={18} /></button>
        </form>
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

function StudentsPage({ students, selectedId, search, setSearch, onAdd, onUpdate, onDelete, onSelect }: { students: StudentBundle[]; selectedId: string; search: string; setSearch: (value: string) => void; onAdd: (record: Record<string, string>) => void; onUpdate: (id: string, record: Record<string, string>) => void; onDelete: (id: string) => Promise<boolean>; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState<Profile | null>(null);
  const filtered = students.filter((student) => `${student.profile.full_name} ${student.profile.email} ${student.profile.school}`.toLowerCase().includes(search.toLowerCase()));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd(Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>);
    event.currentTarget.reset();
    setOpen(false);
  }
  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    onUpdate(editing.id, Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>);
    setEditing(null);
  }
  return <>
    <PageIntro eyebrow="STUDENT DIRECTORY" title="학생 관리" description="학생을 개별 등록하고 성적, 활동, 미팅 기록을 한 곳에서 관리하세요." action={<button className="primary-button" onClick={() => setOpen(!open)}><Plus size={17} />학생 추가</button>} />
    {open && <RecordForm title="새 학생 추가" onClose={() => setOpen(false)} onSubmit={submit} wide>
      <label>학생 이름<input name="full_name" required placeholder="학생 이름" /></label>
      <label>연락 이메일<input name="email" type="email" placeholder="student@example.com" /></label>
      <label>재학 학교<input name="school" placeholder="학교명" /></label>
      <label>졸업 예정 연도<input name="graduation_year" placeholder="예: 2027" /></label>
      <label>희망 전공<input name="target_major" placeholder="예: Computer Science" /></label>
    </RecordForm>}
    {editing && <RecordForm title={`${editing.full_name} 학생 정보 수정`} onClose={() => setEditing(null)} onSubmit={submitEdit} wide>
      <label>학생 이름<input name="full_name" required defaultValue={editing.full_name} placeholder="학생 이름" /></label>
      <label>연락 이메일<input name="email" type="email" defaultValue={editing.email} placeholder="student@example.com" /></label>
      <label>재학 학교<input name="school" defaultValue={editing.school} placeholder="학교명" /></label>
      <label>졸업 예정 연도<input name="graduation_year" defaultValue={editing.graduation_year} placeholder="예: 2027" /></label>
      <label>희망 전공<input name="target_major" defaultValue={editing.target_major} placeholder="예: Computer Science" /></label>
    </RecordForm>}
    {deleting && <section className="panel delete-confirm"><div><span>DELETE STUDENT</span><h3>{deleting.full_name} 학생을 삭제할까요?</h3><p>성적, 활동, 미팅, 추가 정보도 함께 삭제되며 되돌릴 수 없습니다.</p></div><div><button onClick={() => setDeleting(null)}>취소</button><button className="danger-button" onClick={async () => { if (await onDelete(deleting.id)) setDeleting(null); }}><Trash2 size={16} />학생 삭제</button></div></section>}
    <section className="panel student-directory">
      <div className="directory-toolbar"><label><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="이름, 이메일, 학교로 검색" /></label><span>전체 {students.length}명</span></div>
      {students.length ? <div className="student-table"><div className="student-row table-head"><span>학생</span><span>목표 전공</span><span>졸업 연도</span><span>진행률</span><span>최근 활동</span><span>관리</span></div>{filtered.map((student) => <div className={`student-row ${student.profile.id === selectedId ? "selected" : ""}`} key={student.profile.id}><button className="student-cell student-open" onClick={() => onSelect(student.profile.id)}><i>{student.profile.full_name.slice(0, 1)}</i><span><strong>{student.profile.full_name}</strong><small>{student.profile.email || student.profile.school || "연락처 미등록"}</small></span></button><span>{student.profile.target_major || "미정"}</span><span>{student.profile.graduation_year || "미정"}</span><span className="row-progress"><i><b style={{ width: `${student.profile.progress}%` }} /></i>{student.profile.progress}%</span><span>{student.profile.last_active}</span><span className="student-actions"><button onClick={() => onSelect(student.profile.id)} aria-label={`${student.profile.full_name} 기록 열기`}><ArrowRight size={16} /></button><button onClick={() => { setEditing(student.profile); setDeleting(null); setOpen(false); }} aria-label={`${student.profile.full_name} 수정`}><Pencil size={15} /></button><button className="delete" onClick={() => { setDeleting(student.profile); setEditing(null); setOpen(false); }} aria-label={`${student.profile.full_name} 삭제`}><Trash2 size={15} /></button></span></div>)}</div> : <div className="student-empty"><UsersRound size={34} /><h3>등록된 학생이 없습니다.</h3><p>첫 학생을 추가하면 개인별 컨설팅 기록을 시작할 수 있습니다.</p><button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} />첫 학생 추가</button></div>}
    </section>
  </>;
}

function NoStudentState({ onAdd }: { onAdd: () => void }) {
  return <section className="panel no-student-state"><UsersRound size={38} /><h2>관리할 학생을 먼저 추가해 주세요.</h2><p>학생을 등록하면 성적, 활동, 미팅, 추가 정보를 학생별로 나누어 관리할 수 있습니다.</p><button className="primary-button" onClick={onAdd}><Plus size={17} />학생 추가하기</button></section>;
}

function AcademicPage({ student, onAdd, onUpdate, onDelete }: { student: StudentBundle; onAdd: (record: Record<string, string>) => void; onUpdate: (id: string, record: Record<string, string>) => Promise<boolean>; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);
  const collegeGrades = student.grades.filter((grade) => grade.level === "university");
  const highSchoolGrades = student.grades.filter((grade) => grade.level === "high_school");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>; onAdd(data); event.currentTarget.reset(); setOpen(false); }
  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    if (await onUpdate(editing.id, Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>)) setEditing(null);
  }
  return <><PageIntro eyebrow="ACADEMIC RECORD" title="성적표" description="College와 High School 성적을 학기별로 접고 펼쳐 관리하세요." action={<button className="primary-button" onClick={() => { setOpen(!open); setEditing(null); }}><Plus size={17} />성적 추가</button>} />{open && <RecordForm title="새 성적 등록" onClose={() => setOpen(false)} onSubmit={submit}><label>구분<select name="level"><option value="university">College / Dual Enrollment</option><option value="high_school">High School</option></select></label><label>학교명<input name="institution" required placeholder="학교명을 입력하세요" /></label><label>학기<input name="term" required placeholder="예: Fall Semester 2025" /></label><label>과목명<input name="course" required placeholder="예: ECON 2100 · Principles of Macroeconomics" /></label><label>성적<input name="grade" required placeholder="예: A 또는 In Progress" /></label><label>학점 / Unit<input name="credit_hours" type="number" min="0" step="0.5" required defaultValue="1" /></label></RecordForm>}{editing && <RecordForm title={`${editing.course} 수정`} onClose={() => setEditing(null)} onSubmit={submitEdit}><label>구분<select name="level" defaultValue={editing.level}><option value="university">College / Dual Enrollment</option><option value="high_school">High School</option></select></label><label>학교명<input name="institution" required defaultValue={editing.institution} /></label><label>학기<input name="term" required defaultValue={editing.term} /></label><label>과목명<input name="course" required defaultValue={editing.course} /></label><label>성적<input name="grade" required defaultValue={editing.grade} /></label><label>학점 / Unit<input name="credit_hours" type="number" min="0" step="0.5" required defaultValue={editing.credit_hours ?? 1} /></label></RecordForm>}<section className="panel records-panel"><div className="record-summary"><div><BarChart3 size={22} /><span><strong>{student.grades.length}</strong>개 과목 등록</span></div><p>GPA는 4.0 기준 · P와 수강 중 과목 제외</p></div><GradeGroup label="COLLEGE" title="College Transcript" grades={collegeGrades} emptyLabel="등록된 College 성적이 없습니다." defaultOpen onEdit={(grade) => { setEditing(grade); setOpen(false); }} onDelete={onDelete} /><GradeGroup label="HIGH SCHOOL" title="High School Transcript" grades={highSchoolGrades} emptyLabel="등록된 High School 성적이 없습니다." onEdit={(grade) => { setEditing(grade); setOpen(false); }} onDelete={onDelete} /></section></>;
}

function termSortValue(term: string) {
  const year = Number(term.match(/20\d{2}/)?.[0] ?? 0);
  const season = /fall/i.test(term) ? 4 : /summer/i.test(term) ? 3 : /spring/i.test(term) ? 2 : /winter/i.test(term) ? 1 : 0;
  const schoolYear = Number(term.match(/([123])(?:st|nd|rd) Year/i)?.[1] ?? 0);
  const semester = Number(term.match(/Semester ([12])/i)?.[1] ?? 0);
  return year ? year * 10 + season : schoolYear * 10 + semester;
}

function calculateGpa(grades: Grade[]) {
  const gradePoints: Record<string, number> = { "A+": 4, A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, "D+": 1.3, D: 1, "D-": 0.7, E: 0, F: 0 };
  return grades.reduce((result, grade) => {
    const points = gradePoints[grade.grade.trim().toUpperCase()];
    const credits = Number(grade.credit_hours ?? 1);
    if (points === undefined || !Number.isFinite(credits) || credits <= 0) return result;
    return { qualityPoints: result.qualityPoints + points * credits, credits: result.credits + credits };
  }, { qualityPoints: 0, credits: 0 });
}

function GradeGroup({ label, title, grades, emptyLabel, defaultOpen, onEdit, onDelete }: { label: string; title: string; grades: Grade[]; emptyLabel: string; defaultOpen?: boolean; onEdit: (grade: Grade) => void; onDelete: (id: string) => void }) {
  const gpa = calculateGpa(grades);
  const terms = Array.from(grades.reduce((groups, grade) => {
    const group = groups.get(grade.term) ?? [];
    group.push(grade);
    groups.set(grade.term, group);
    return groups;
  }, new Map<string, Grade[]>()).entries()).sort(([termA], [termB]) => termSortValue(termB) - termSortValue(termA));
  return <details className="grade-group" open={defaultOpen}><summary className="grade-group-head"><div><span>{label}</span><h2>{title}</h2></div><div><span className="grade-gpa"><small>CURRENT GPA</small><strong>{gpa.credits ? (gpa.qualityPoints / gpa.credits).toFixed(2) : "—"}</strong><small>/ 4.00</small></span><em>{grades.length} COURSES</em><ChevronDown size={18} /></div></summary>{grades.length ? <div className="term-groups">{terms.map(([term, termGrades]) => <details className="term-group" key={term}><summary><div><span>TERM</span><strong>{term}</strong></div><div><em>{termGrades.length}과목</em><ChevronDown size={17} /></div></summary><div className="grade-list">{termGrades.map((grade) => <div className="grade-row" key={grade.id}><div className="course-icon"><BookOpen size={19} /></div><div className="course-main"><span>{label}</span><strong>{grade.course}</strong><small>{grade.institution} · {Number(grade.credit_hours ?? 1)} Units</small></div><b className={grade.grade === "In Progress" ? "in-progress" : ""}>{grade.grade}</b><span className="grade-row-actions"><button onClick={() => onEdit(grade)} aria-label={`${grade.course} 수정`}><Pencil size={16} /></button><button onClick={() => onDelete(grade.id)} aria-label={`${grade.course} 삭제`}><Trash2 size={17} /></button></span></div>)}</div></details>)}</div> : <EmptyState label={emptyLabel} />}</details>;
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

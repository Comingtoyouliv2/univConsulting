-- NOVA University Consulting database schema
-- New Supabase projects: run this file once in the SQL editor.

create extension if not exists "pgcrypto";

-- The authenticated account is the single consulting manager.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.email, ''), 'admin');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Students are managed records, not authentication accounts.
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null default '',
  school text not null default '',
  graduation_year text not null default '',
  target_major text not null default '',
  progress integer not null default 10 check (progress between 0 and 100),
  last_active timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  level text not null check (level in ('high_school', 'university')),
  institution text not null,
  term text not null,
  course text not null,
  grade text not null,
  credit_hours numeric(5,2) not null default 1 check (credit_hours >= 0),
  korean_rank numeric(3,1) check (korean_rank between 1 and 9),
  created_at timestamptz not null default now()
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  category text not null,
  title text not null,
  organization text not null,
  role text not null,
  period text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  meeting_date date not null,
  consultant text not null,
  format text not null,
  summary text not null,
  next_steps text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.additional_info (
  student_id uuid primary key references public.students(id) on delete cascade,
  target_countries text not null default '',
  target_major text not null default '',
  application_round text not null default '',
  budget text not null default '',
  test_scores text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_owner_id on public.students(owner_id);
create index if not exists idx_grades_student_id on public.grades(student_id);
create index if not exists idx_experiences_student_id on public.experiences(student_id);
create index if not exists idx_meeting_notes_student_date on public.meeting_notes(student_id, meeting_date desc);

create or replace function public.owns_student(check_student_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(
    select 1 from public.students
    where id = check_student_id and owner_id = auth.uid()
  );
$$;

create or replace function public.delete_managed_student(target_student_id uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.students
  where id = target_student_id and owner_id = auth.uid();
  return found;
end;
$$;

revoke all on function public.delete_managed_student(uuid) from public;
grant execute on function public.delete_managed_student(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.grades enable row level security;
alter table public.experiences enable row level security;
alter table public.meeting_notes enable row level security;
alter table public.additional_info enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = 'admin');

create policy "students_select_own" on public.students for select using (owner_id = auth.uid());
create policy "students_insert_own" on public.students for insert with check (owner_id = auth.uid());
create policy "students_update_own" on public.students for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "students_delete_own" on public.students for delete using (owner_id = auth.uid());

create policy "grades_select_owned" on public.grades for select using (public.owns_student(student_id));
create policy "grades_insert_owned" on public.grades for insert with check (public.owns_student(student_id));
create policy "grades_update_owned" on public.grades for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));
create policy "grades_delete_owned" on public.grades for delete using (public.owns_student(student_id));

create policy "experiences_select_owned" on public.experiences for select using (public.owns_student(student_id));
create policy "experiences_insert_owned" on public.experiences for insert with check (public.owns_student(student_id));
create policy "experiences_update_owned" on public.experiences for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));
create policy "experiences_delete_owned" on public.experiences for delete using (public.owns_student(student_id));

create policy "meetings_select_owned" on public.meeting_notes for select using (public.owns_student(student_id));
create policy "meetings_insert_owned" on public.meeting_notes for insert with check (public.owns_student(student_id));
create policy "meetings_update_owned" on public.meeting_notes for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));
create policy "meetings_delete_owned" on public.meeting_notes for delete using (public.owns_student(student_id));

create policy "additional_select_owned" on public.additional_info for select using (public.owns_student(student_id));
create policy "additional_insert_owned" on public.additional_info for insert with check (public.owns_student(student_id));
create policy "additional_update_owned" on public.additional_info for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));
create policy "additional_delete_owned" on public.additional_info for delete using (public.owns_student(student_id));

analyze;

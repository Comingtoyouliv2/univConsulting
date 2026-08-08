-- NOVA University Consulting database schema
-- Run this once in the Supabase SQL editor before connecting the Vercel project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  school text not null default '',
  graduation_year text not null default '',
  target_major text not null default '',
  progress integer not null default 10 check (progress between 0 and 100),
  last_active timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.email, ''), 'student');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  level text not null check (level in ('high_school', 'university')),
  institution text not null,
  term text not null,
  course text not null,
  grade text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
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
  student_id uuid not null references public.profiles(id) on delete cascade,
  meeting_date date not null,
  consultant text not null,
  format text not null,
  summary text not null,
  next_steps text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.additional_info (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  target_countries text not null default '',
  target_major text not null default '',
  application_round text not null default '',
  budget text not null default '',
  test_scores text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists idx_grades_student_id on public.grades(student_id);
create index if not exists idx_experiences_student_id on public.experiences(student_id);
create index if not exists idx_meeting_notes_student_date on public.meeting_notes(student_id, meeting_date desc);

alter table public.profiles enable row level security;
alter table public.grades enable row level security;
alter table public.experiences enable row level security;
alter table public.meeting_notes enable row level security;
alter table public.additional_info enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (public.is_admin() or (id = auth.uid() and role = 'student'));

create policy "grades_select_own_or_admin" on public.grades for select using (student_id = auth.uid() or public.is_admin());
create policy "grades_insert_own_or_admin" on public.grades for insert with check (student_id = auth.uid() or public.is_admin());
create policy "grades_update_own_or_admin" on public.grades for update using (student_id = auth.uid() or public.is_admin());
create policy "grades_delete_own_or_admin" on public.grades for delete using (student_id = auth.uid() or public.is_admin());

create policy "experiences_select_own_or_admin" on public.experiences for select using (student_id = auth.uid() or public.is_admin());
create policy "experiences_insert_own_or_admin" on public.experiences for insert with check (student_id = auth.uid() or public.is_admin());
create policy "experiences_update_own_or_admin" on public.experiences for update using (student_id = auth.uid() or public.is_admin());
create policy "experiences_delete_own_or_admin" on public.experiences for delete using (student_id = auth.uid() or public.is_admin());

create policy "meetings_select_own_or_admin" on public.meeting_notes for select using (student_id = auth.uid() or public.is_admin());
create policy "meetings_insert_own_or_admin" on public.meeting_notes for insert with check (student_id = auth.uid() or public.is_admin());
create policy "meetings_update_own_or_admin" on public.meeting_notes for update using (student_id = auth.uid() or public.is_admin());
create policy "meetings_delete_own_or_admin" on public.meeting_notes for delete using (student_id = auth.uid() or public.is_admin());

create policy "additional_select_own_or_admin" on public.additional_info for select using (student_id = auth.uid() or public.is_admin());
create policy "additional_insert_own_or_admin" on public.additional_info for insert with check (student_id = auth.uid() or public.is_admin());
create policy "additional_update_own_or_admin" on public.additional_info for update using (student_id = auth.uid() or public.is_admin()) with check (student_id = auth.uid() or public.is_admin());

-- Promote trusted staff manually; never expose admin self-registration.
-- update public.profiles set role = 'admin' where email = 'consultant@example.com';

analyze;

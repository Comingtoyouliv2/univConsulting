-- Existing NOVA projects only: migrate from student login accounts to
-- one manager account with separately managed student records.

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

-- Preserve any records already attached to an old profile by creating a
-- matching managed student only when that profile has student data.
insert into public.students (id, owner_id, full_name, email, school, graduation_year, target_major, progress, last_active, created_at)
select p.id, p.id, p.full_name, p.email, p.school, p.graduation_year, p.target_major, p.progress, p.last_active, p.created_at
from public.profiles p
where exists (select 1 from public.grades g where g.student_id = p.id)
   or exists (select 1 from public.experiences e where e.student_id = p.id)
   or exists (select 1 from public.meeting_notes m where m.student_id = p.id)
   or exists (select 1 from public.additional_info a where a.student_id = p.id)
on conflict (id) do nothing;

alter table public.grades drop constraint if exists grades_student_id_fkey;
alter table public.experiences drop constraint if exists experiences_student_id_fkey;
alter table public.meeting_notes drop constraint if exists meeting_notes_student_id_fkey;
alter table public.additional_info drop constraint if exists additional_info_student_id_fkey;

alter table public.grades add constraint grades_student_id_fkey foreign key (student_id) references public.students(id) on delete cascade;
alter table public.experiences add constraint experiences_student_id_fkey foreign key (student_id) references public.students(id) on delete cascade;
alter table public.meeting_notes add constraint meeting_notes_student_id_fkey foreign key (student_id) references public.students(id) on delete cascade;
alter table public.additional_info add constraint additional_info_student_id_fkey foreign key (student_id) references public.students(id) on delete cascade;

alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'admin';
alter table public.profiles alter column role set default 'admin';
alter table public.profiles add constraint profiles_role_check check (role = 'admin');

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

create index if not exists idx_students_owner_id on public.students(owner_id);

create or replace function public.owns_student(check_student_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.students where id = check_student_id and owner_id = auth.uid());
$$;

alter table public.students enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = 'admin');

drop policy if exists "students_select_own" on public.students;
drop policy if exists "students_insert_own" on public.students;
drop policy if exists "students_update_own" on public.students;
drop policy if exists "students_delete_own" on public.students;
create policy "students_select_own" on public.students for select using (owner_id = auth.uid());
create policy "students_insert_own" on public.students for insert with check (owner_id = auth.uid());
create policy "students_update_own" on public.students for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "students_delete_own" on public.students for delete using (owner_id = auth.uid());

drop policy if exists "grades_select_own_or_admin" on public.grades;
drop policy if exists "grades_insert_own_or_admin" on public.grades;
drop policy if exists "grades_update_own_or_admin" on public.grades;
drop policy if exists "grades_delete_own_or_admin" on public.grades;
create policy "grades_select_owned" on public.grades for select using (public.owns_student(student_id));
create policy "grades_insert_owned" on public.grades for insert with check (public.owns_student(student_id));
create policy "grades_update_owned" on public.grades for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));
create policy "grades_delete_owned" on public.grades for delete using (public.owns_student(student_id));

drop policy if exists "experiences_select_own_or_admin" on public.experiences;
drop policy if exists "experiences_insert_own_or_admin" on public.experiences;
drop policy if exists "experiences_update_own_or_admin" on public.experiences;
drop policy if exists "experiences_delete_own_or_admin" on public.experiences;
create policy "experiences_select_owned" on public.experiences for select using (public.owns_student(student_id));
create policy "experiences_insert_owned" on public.experiences for insert with check (public.owns_student(student_id));
create policy "experiences_update_owned" on public.experiences for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));
create policy "experiences_delete_owned" on public.experiences for delete using (public.owns_student(student_id));

drop policy if exists "meetings_select_own_or_admin" on public.meeting_notes;
drop policy if exists "meetings_insert_own_or_admin" on public.meeting_notes;
drop policy if exists "meetings_update_own_or_admin" on public.meeting_notes;
drop policy if exists "meetings_delete_own_or_admin" on public.meeting_notes;
create policy "meetings_select_owned" on public.meeting_notes for select using (public.owns_student(student_id));
create policy "meetings_insert_owned" on public.meeting_notes for insert with check (public.owns_student(student_id));
create policy "meetings_update_owned" on public.meeting_notes for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));
create policy "meetings_delete_owned" on public.meeting_notes for delete using (public.owns_student(student_id));

drop policy if exists "additional_select_own_or_admin" on public.additional_info;
drop policy if exists "additional_insert_own_or_admin" on public.additional_info;
drop policy if exists "additional_update_own_or_admin" on public.additional_info;
create policy "additional_select_owned" on public.additional_info for select using (public.owns_student(student_id));
create policy "additional_insert_owned" on public.additional_info for insert with check (public.owns_student(student_id));
create policy "additional_update_owned" on public.additional_info for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));

analyze;

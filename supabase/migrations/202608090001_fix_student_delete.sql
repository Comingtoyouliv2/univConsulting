-- Repair student deletion for projects upgraded from the original profile-based schema.

do $$
declare
  relation_name text;
  constraint_row record;
begin
  foreach relation_name in array array['grades', 'experiences', 'meeting_notes', 'additional_info']
  loop
    for constraint_row in
      select conname
      from pg_constraint
      where contype = 'f'
        and conrelid = format('public.%I', relation_name)::regclass
        and confrelid in ('public.profiles'::regclass, 'public.students'::regclass)
    loop
      execute format('alter table public.%I drop constraint %I', relation_name, constraint_row.conname);
    end loop;

    execute format(
      'alter table public.%I add constraint %I foreign key (student_id) references public.students(id) on delete cascade',
      relation_name,
      relation_name || '_student_id_fkey'
    );
  end loop;
end;
$$;

drop policy if exists "students_delete_own" on public.students;
create policy "students_delete_own" on public.students
for delete using (owner_id = auth.uid());

drop policy if exists "additional_delete_owned" on public.additional_info;
create policy "additional_delete_owned" on public.additional_info
for delete using (public.owns_student(student_id));

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

analyze;

alter table public.grades
add column if not exists credit_hours numeric(5,2) not null default 1
check (credit_hours >= 0);

update public.grades
set credit_hours = case
  when course like 'BUS 0900 ·%' then 0
  when course like 'UNIV 1000 ·%' or course like 'BIOL 1011 ·%' then 1
  else 3
end
where institution = 'Austin Peay State University';

analyze public.grades;

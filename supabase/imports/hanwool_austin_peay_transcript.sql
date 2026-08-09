-- Austin Peay transcript import for the managed student 이한울 / Hanwool Lee.
-- Safe to run more than once: matching course rows are skipped and credits are refreshed.

do $$
begin
  if not exists (
    select 1 from public.students
    where lower(full_name) in ('이한울', 'hanwool lee', 'lee hanwool')
  ) then
    raise exception '이한울 학생을 먼저 학생 관리 화면에서 등록해 주세요.';
  end if;
end;
$$;

with target_student as (
  select id
  from public.students
  where lower(full_name) in ('이한울', 'hanwool lee', 'lee hanwool')
  order by created_at
  limit 1
), transcript(level, institution, term, course, grade, credit_hours) as (
  values
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'BUS 0900 · Business Student Success', 'P', 0),
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'MKT 2010 · Principles of Marketing', 'B', 3),
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'MUS 1030 · Introduction to Music', 'A', 3),
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'POLS 2000 · Introduction to Politics', 'A', 3),
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'RDG 1010 · Critical Reading and Inquiry', 'A', 3),
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'UNIV 1000 · University Success', 'A', 1),
    ('university', 'Austin Peay State University', 'Spring Semester 2026', 'ART 1035 · Introduction to Art', 'A', 3),
    ('university', 'Austin Peay State University', 'Spring Semester 2026', 'COMM 2045 · Public Speaking', 'A', 3),
    ('university', 'Austin Peay State University', 'Spring Semester 2026', 'ECON 2100 · Principles of Macroeconomics', 'A', 3),
    ('university', 'Austin Peay State University', 'Spring Semester 2026', 'ENGL 1010 · English Composition I', 'A', 3),
    ('university', 'Austin Peay State University', 'Spring Semester 2026', 'MATH 1710 · Precalculus Algebra', 'A', 3),
    ('university', 'Austin Peay State University', 'Summer Session 2026', 'BUS 2100 · Business Statistics', 'In Progress', 3),
    ('university', 'Austin Peay State University', 'Summer Session 2026', 'ECON 2200 · Principles of Microeconomics', 'In Progress', 3),
    ('university', 'Austin Peay State University', 'Summer Session 2026', 'HIST 2320 · Modern World History', 'In Progress', 3),
    ('university', 'Austin Peay State University', 'Fall Semester 2026', 'ACCT 2010 · Principles of Accounting I', 'In Progress', 3),
    ('university', 'Austin Peay State University', 'Fall Semester 2026', 'BIOL 1010 · Introduction to Biology', 'In Progress', 3),
    ('university', 'Austin Peay State University', 'Fall Semester 2026', 'BIOL 1011 · Introduction to Biology Lab', 'In Progress', 1),
    ('university', 'Austin Peay State University', 'Fall Semester 2026', 'ENGL 1020 · English Composition II', 'In Progress', 3),
    ('university', 'Austin Peay State University', 'Fall Semester 2026', 'HIST 2030 · Tennessee History', 'In Progress', 3)
)
insert into public.grades (student_id, level, institution, term, course, grade, credit_hours)
select target_student.id, transcript.level, transcript.institution, transcript.term,
  transcript.course, transcript.grade, transcript.credit_hours
from target_student
cross join transcript
where not exists (
  select 1
  from public.grades existing
  where existing.student_id = target_student.id
    and existing.level = transcript.level
    and existing.institution = transcript.institution
    and existing.term = transcript.term
    and existing.course = transcript.course
);

with transcript(course, credit_hours) as (
  values
    ('BUS 0900 · Business Student Success', 0),
    ('MKT 2010 · Principles of Marketing', 3),
    ('MUS 1030 · Introduction to Music', 3),
    ('POLS 2000 · Introduction to Politics', 3),
    ('RDG 1010 · Critical Reading and Inquiry', 3),
    ('UNIV 1000 · University Success', 1),
    ('ART 1035 · Introduction to Art', 3),
    ('COMM 2045 · Public Speaking', 3),
    ('ECON 2100 · Principles of Macroeconomics', 3),
    ('ENGL 1010 · English Composition I', 3),
    ('MATH 1710 · Precalculus Algebra', 3),
    ('BUS 2100 · Business Statistics', 3),
    ('ECON 2200 · Principles of Microeconomics', 3),
    ('HIST 2320 · Modern World History', 3),
    ('ACCT 2010 · Principles of Accounting I', 3),
    ('BIOL 1010 · Introduction to Biology', 3),
    ('BIOL 1011 · Introduction to Biology Lab', 1),
    ('ENGL 1020 · English Composition II', 3),
    ('HIST 2030 · Tennessee History', 3)
)
update public.grades existing
set credit_hours = transcript.credit_hours
from transcript
where existing.institution = 'Austin Peay State University'
  and existing.course = transcript.course;

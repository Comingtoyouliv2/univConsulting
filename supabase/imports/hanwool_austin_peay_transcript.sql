-- Austin Peay transcript import for the managed student 이한울 / Hanwool Lee.
-- Safe to run more than once: matching course rows are skipped.

do $$
begin
  if not exists (
    select 1 from public.students
    where lower(full_name) in ('이한울', 'hanwool lee')
  ) then
    raise exception '이한울 학생을 먼저 학생 관리 화면에서 등록해 주세요.';
  end if;
end;
$$;

with target_student as (
  select id
  from public.students
  where lower(full_name) in ('이한울', 'hanwool lee')
  order by created_at
  limit 1
), transcript(level, institution, term, course, grade) as (
  values
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'BUS 0900 · Business Student Success', 'P'),
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'MKT 2010 · Principles of Marketing', 'B'),
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'MUS 1030 · Introduction to Music', 'A'),
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'POLS 2000 · Introduction to Politics', 'A'),
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'RDG 1010 · Critical Reading and Inquiry', 'A'),
    ('university', 'Austin Peay State University', 'Fall Semester 2025', 'UNIV 1000 · University Success', 'A'),
    ('university', 'Austin Peay State University', 'Spring Semester 2026', 'ART 1035 · Introduction to Art', 'A'),
    ('university', 'Austin Peay State University', 'Spring Semester 2026', 'COMM 2045 · Public Speaking', 'A'),
    ('university', 'Austin Peay State University', 'Spring Semester 2026', 'ECON 2100 · Principles of Macroeconomics', 'A'),
    ('university', 'Austin Peay State University', 'Spring Semester 2026', 'ENGL 1010 · English Composition I', 'A'),
    ('university', 'Austin Peay State University', 'Spring Semester 2026', 'MATH 1710 · Precalculus Algebra', 'A'),
    ('university', 'Austin Peay State University', 'Summer Session 2026', 'BUS 2100 · Business Statistics', 'In Progress'),
    ('university', 'Austin Peay State University', 'Summer Session 2026', 'ECON 2200 · Principles of Microeconomics', 'In Progress'),
    ('university', 'Austin Peay State University', 'Summer Session 2026', 'HIST 2320 · Modern World History', 'In Progress'),
    ('university', 'Austin Peay State University', 'Fall Semester 2026', 'ACCT 2010 · Principles of Accounting I', 'In Progress'),
    ('university', 'Austin Peay State University', 'Fall Semester 2026', 'BIOL 1010 · Introduction to Biology', 'In Progress'),
    ('university', 'Austin Peay State University', 'Fall Semester 2026', 'BIOL 1011 · Introduction to Biology Lab', 'In Progress'),
    ('university', 'Austin Peay State University', 'Fall Semester 2026', 'ENGL 1020 · English Composition II', 'In Progress'),
    ('university', 'Austin Peay State University', 'Fall Semester 2026', 'HIST 2030 · Tennessee History', 'In Progress')
)
insert into public.grades (student_id, level, institution, term, course, grade)
select target_student.id, transcript.level, transcript.institution, transcript.term, transcript.course, transcript.grade
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

-- Kyungmin High School transcript import for 이한울 / Hanwool Lee.
-- Safe to run more than once: matching course rows are skipped.

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
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'Korean Language', 'B', 4),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'Mathematics', 'A', 4),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'English', 'D', 3),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'Korean History', 'B', 3),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'Integrated Social Studies', 'B', 3),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'Integrated Sciences', 'C', 3),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'Science Laboratory Experiments', 'A', 1),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'Sports & Life', 'A', 1),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'Informatics', 'B', 3),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'Religious Studies', 'P', 1),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'Life and Chinese Character', 'B', 1),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 1', 'Fine Arts', 'A', 3),

    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'Korean Language', 'B', 4),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'Mathematics', 'B', 4),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'English', 'C', 3),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'Korean History', 'D', 3),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'Integrated Social Studies', 'B', 3),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'Integrated Sciences', 'C', 3),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'Science Laboratory Experiments', 'A', 1),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'Sports & Life', 'A', 1),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'Religious Studies', 'P', 1),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'Programming', 'A', 3),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'Life and Chinese Character', 'B', 1),
    ('high_school', 'Kyungmin High School', '1st Year · Semester 2', 'Music', 'A', 3),

    ('high_school', 'Kyungmin High School', '2nd Year · Semester 1', 'Literature', 'A', 4),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 1', 'Reading Classics', 'A', 2),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 1', 'Mathematics I', 'C', 4),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 1', 'English I', 'B', 4),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 1', 'Economics', 'B', 3),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 1', 'Ethics & Thoughts', 'C', 3),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 1', 'Biology I', 'C', 3),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 1', 'Music Appreciation & Criticism', 'A', 2),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 1', 'Career & Occupation', 'P', 1),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 1', 'Chinese I', 'C', 2),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 1', 'Exercise & Health', 'A', 2),

    ('high_school', 'Kyungmin High School', '2nd Year · Semester 2', 'Reading', 'B', 4),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 2', 'Reading Classics', 'A', 2),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 2', 'Mathematics II', 'C', 4),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 2', 'English II', 'B', 4),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 2', 'Economics', 'B', 3),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 2', 'Ethics & Thoughts', 'C', 3),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 2', 'Biology I', 'C', 3),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 2', 'Music Appreciation & Criticism', 'A', 2),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 2', 'Career & Occupation', 'P', 1),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 2', 'Chinese I', 'D', 2),
    ('high_school', 'Kyungmin High School', '2nd Year · Semester 2', 'Exercise & Health', 'A', 2),

    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'Language and Media', 'A', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'Probability and Statistics', 'A', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'Mathematics Project', 'A', 2),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'English Reading & Writing', 'A', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'Politics & Law', 'B', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'Society & Culture', 'B', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'Life & Ethics', 'C', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'Inquiry on Social Issues', 'A', 2),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'Psychology', 'P', 2),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'Global Citizen', 'P', 1),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'Artificial Intelligence and Future Society', 'A', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 1', 'Physical Education', 'A', 2),

    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'Language and Media', 'B', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'Probability and Statistics', 'C', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'Mathematics Project', 'A', 2),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'English Reading & Writing', 'B', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'Politics & Law', 'B', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'Society & Culture', 'E', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'Life & Ethics', 'C', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'Inquiry on Social Issues', 'A', 2),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'Psychology', 'P', 2),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'Global Citizen', 'P', 1),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'Artificial Intelligence and Future Society', 'B', 3),
    ('high_school', 'Kyungmin High School', '3rd Year · Semester 2', 'Physical Education', 'A', 2)
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

-- Refresh the Korean 1–9 ranks when the courses were imported previously.
with target_student as (
  select id
  from public.students
  where lower(full_name) in ('이한울', 'hanwool lee', 'lee hanwool')
  order by created_at
  limit 1
), ranks(term, course, korean_rank) as (
  values
    ('1st Year · Semester 1', 'Korean Language', 4),
    ('1st Year · Semester 1', 'Mathematics', 3),
    ('1st Year · Semester 1', 'English', 4),
    ('1st Year · Semester 1', 'Korean History', 4),
    ('1st Year · Semester 1', 'Integrated Social Studies', 4),
    ('1st Year · Semester 1', 'Integrated Sciences', 4),
    ('1st Year · Semester 1', 'Informatics', 3),
    ('1st Year · Semester 2', 'Korean Language', 3),
    ('1st Year · Semester 2', 'Mathematics', 4),
    ('1st Year · Semester 2', 'English', 4),
    ('1st Year · Semester 2', 'Korean History', 5),
    ('1st Year · Semester 2', 'Integrated Social Studies', 4),
    ('1st Year · Semester 2', 'Integrated Sciences', 5),
    ('2nd Year · Semester 1', 'Literature', 4),
    ('2nd Year · Semester 1', 'Mathematics I', 4),
    ('2nd Year · Semester 1', 'English I', 4),
    ('2nd Year · Semester 1', 'Economics', 3),
    ('2nd Year · Semester 1', 'Ethics & Thoughts', 5),
    ('2nd Year · Semester 1', 'Biology I', 4),
    ('2nd Year · Semester 1', 'Chinese I', 5),
    ('2nd Year · Semester 2', 'Reading', 4),
    ('2nd Year · Semester 2', 'Mathematics II', 4),
    ('2nd Year · Semester 2', 'English II', 4),
    ('2nd Year · Semester 2', 'Economics', 3),
    ('2nd Year · Semester 2', 'Ethics & Thoughts', 4),
    ('2nd Year · Semester 2', 'Biology I', 4),
    ('2nd Year · Semester 2', 'Chinese I', 5),
    ('3rd Year · Semester 1', 'Language and Media', 4),
    ('3rd Year · Semester 1', 'Probability and Statistics', 3),
    ('3rd Year · Semester 1', 'English Reading & Writing', 4),
    ('3rd Year · Semester 1', 'Politics & Law', 3),
    ('3rd Year · Semester 1', 'Society & Culture', 3),
    ('3rd Year · Semester 1', 'Life & Ethics', 4),
    ('3rd Year · Semester 2', 'Language and Media', 3),
    ('3rd Year · Semester 2', 'Probability and Statistics', 2),
    ('3rd Year · Semester 2', 'English Reading & Writing', 3),
    ('3rd Year · Semester 2', 'Politics & Law', 2),
    ('3rd Year · Semester 2', 'Society & Culture', 3),
    ('3rd Year · Semester 2', 'Life & Ethics', 2)
)
update public.grades grade
set korean_rank = ranks.korean_rank
from target_student
cross join ranks
where grade.student_id = target_student.id
  and grade.level = 'high_school'
  and grade.institution = 'Kyungmin High School'
  and grade.term = ranks.term
  and grade.course = ranks.course;

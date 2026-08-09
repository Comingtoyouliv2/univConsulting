-- Add Korea's 1–9 rank field and populate Hanwool Lee's Kyungmin transcript.

alter table public.grades
add column if not exists korean_rank numeric(3,1)
check (korean_rank between 1 and 9);

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

analyze public.grades;

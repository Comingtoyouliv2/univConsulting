alter table public.meeting_notes
add column if not exists font_size smallint not null default 15
check (font_size between 12 and 22);

analyze public.meeting_notes;

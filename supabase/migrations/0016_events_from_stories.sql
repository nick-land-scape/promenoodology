-- An evening for each story, and a link between them.
--
-- The two have always been the same kind of thing looked at from two ends: an
-- evening is something that is going to happen, a story is what happened. Until
-- now nothing joined them, so a story could not say "this was one of ours" and an
-- evening could not point at what came of it.
alter table public.events add column if not exists story_id uuid references public.stories(id) on delete set null;

create index if not exists events_by_story on public.events (story_id);

-- One evening per story, from what the story already says.
--
-- Two things worth being straight about. The date is a guess: a story records
-- when it happened as words — "August 2023", "2024", "2025–26" — so a month and a
-- year become the first of that month and a bare year becomes the first of
-- January, and what the story actually said is written into the note so nobody
-- has to go looking for it. And every one is created hidden, because seven
-- guessed dates appearing in the members' app would be worse than none.
insert into public.events (title, place, happens_on, note, photo_path, published, story_id)
select
  s.title,
  coalesce(s.place, ''),
  case
    when s.happened ~* '^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}$'
      then to_date(s.happened, 'FMMonth YYYY')
    when s.happened ~ '\d{4}'
      then to_date(substring(s.happened from '\d{4}'), 'YYYY')
    else current_date
  end,
  'From the story. It says it happened in ' || coalesce(nullif(s.happened, ''), 'no stated time') ||
    ' — the date on this evening is a guess from that, so correct it.',
  (select p.path from public.photos p where p.id = s.featured_photo_id),
  false,
  s.id
from public.stories s
where not exists (select 1 from public.events e where e.story_id = s.id);

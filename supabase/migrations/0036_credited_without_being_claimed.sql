-- Being on a flyer is not the same as being one of ours.
--
-- Six organisations funded the summer's programme on the friche at Versoix, and
-- their marks are on its flyer, so they are on the evening's page — as they
-- should be. But `published` was doing two jobs at once: it decided both whether
-- an organisation is credited *anywhere* and whether it stands in the row of
-- logos on the community page under the word "with".
--
-- Those are different claims. One says "these people paid for this evening",
-- which is a fact about an evening. The other says "these are the people we work
-- with", which is a claim about a relationship, and it is not ours to make on
-- somebody else's behalf because they backed one project.
--
-- So `published` keeps its old meaning — shown at all — and this decides the
-- second, narrower question. Default true, because every partner that existed
-- before this was on the community page and should stay there.

alter table public.associations
  add column if not exists on_community boolean not null default true;

comment on column public.associations.on_community is
  'Does this one stand in the row of logos on the community page? Separate from `published`, which is whether it is credited anywhere at all — a funder of one evening is credited on that evening without being claimed as an ongoing partner. See migration 0036.';

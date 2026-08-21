-- The five colours again, for when the paper is turned down.
--
-- Dark was a considered inversion with no way to argue with it: a warm paper so
-- photographs do not look like windows, and the accents lifted until they can be
-- read rather than merely seen. Those are still the defaults — every column here
-- is empty, and empty means "as drawn" exactly as it does for the light ones —
-- but they are now defaults rather than decisions somebody else made.

alter table public.theme add column if not exists dark_ink text not null default '';
alter table public.theme add column if not exists dark_paper text not null default '';
alter table public.theme add column if not exists dark_purple text not null default '';
alter table public.theme add column if not exists dark_blue text not null default '';
alter table public.theme add column if not exists dark_pink text not null default '';

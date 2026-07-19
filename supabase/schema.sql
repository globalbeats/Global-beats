-- GlobalBeat PostgreSQL / Supabase schema
-- Run this once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

create type public.user_role as enum ('listener', 'artist', 'admin');
create type public.subscription_plan as enum ('free', 'premium');
create type public.release_status as enum ('draft', 'pending', 'approved', 'rejected', 'blocked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'listener',
  plan public.subscription_plan not null default 'free',
  stripe_customer_id text unique,
  subscription_status text,
  country_code text,
  preferred_languages text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  stage_name text not null,
  bio text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  title text not null,
  album text,
  genre text not null,
  language text not null,
  region text not null default 'Global',
  mood_tags text[] not null default '{}',
  activity_tags text[] not null default '{}',
  energy smallint not null default 50 check (energy between 0 and 100),
  audio_path text,
  cover_path text,
  status public.release_status not null default 'draft',
  premium_only boolean not null default false,
  explicit boolean not null default false,
  release_date date,
  rights_owner text,
  rights_document_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.track_territories (
  track_id uuid not null references public.tracks(id) on delete cascade,
  country_code text not null,
  allowed boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  primary key (track_id, country_code)
);

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_public boolean not null default false,
  vibe_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.playlist_tracks (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (playlist_id, track_id)
);

create table public.listening_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  track_id uuid not null references public.tracks(id) on delete cascade,
  event_type text not null check (event_type in ('play', 'skip', 'complete', 'like')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.release_reviews (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  decision public.release_status not null,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_premium()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and plan = 'premium');
$$;

alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.tracks enable row level security;
alter table public.track_territories enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.listening_events enable row level security;
alter table public.release_reviews enable row level security;

create policy "profiles readable by owner or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles editable by owner" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "artists are publicly readable" on public.artists for select using (true);
create policy "artists manageable by owner" on public.artists for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

create policy "approved tracks are public" on public.tracks for select using (
  status = 'approved' and (premium_only = false or public.is_premium())
  or public.is_admin()
  or exists(select 1 from public.artists a where a.id = artist_id and a.owner_id = auth.uid())
);
create policy "artists create their tracks" on public.tracks for insert with check (
  exists(select 1 from public.artists a where a.id = artist_id and a.owner_id = auth.uid())
);
create policy "artists edit unapproved tracks" on public.tracks for update using (
  public.is_admin() or exists(select 1 from public.artists a where a.id = artist_id and a.owner_id = auth.uid() and status in ('draft','pending','rejected'))
);
create policy "admins remove tracks" on public.tracks for delete using (public.is_admin());

create policy "territories public read" on public.track_territories for select using (true);
create policy "territories admin write" on public.track_territories for all using (public.is_admin()) with check (public.is_admin());

create policy "public playlists or owner" on public.playlists for select using (is_public or owner_id = auth.uid() or public.is_admin());
create policy "playlist owner write" on public.playlists for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "playlist tracks readable with playlist" on public.playlist_tracks for select using (exists(select 1 from public.playlists p where p.id = playlist_id and (p.is_public or p.owner_id = auth.uid() or public.is_admin())));
create policy "playlist tracks owner write" on public.playlist_tracks for all using (exists(select 1 from public.playlists p where p.id = playlist_id and (p.owner_id = auth.uid() or public.is_admin()))) with check (exists(select 1 from public.playlists p where p.id = playlist_id and (p.owner_id = auth.uid() or public.is_admin())));

create policy "listeners create events" on public.listening_events for insert with check (user_id is null or user_id = auth.uid());
create policy "listeners read own events" on public.listening_events for select using (user_id = auth.uid() or public.is_admin());
create policy "reviews admin only" on public.release_reviews for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public) values ('track-audio', 'track-audio', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('cover-art', 'cover-art', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('rights-documents', 'rights-documents', false) on conflict do nothing;

create policy "cover art public read" on storage.objects for select using (bucket_id = 'cover-art');
create policy "artists upload cover art" on storage.objects for insert to authenticated with check (bucket_id = 'cover-art');
create policy "approved audio authenticated read" on storage.objects for select to authenticated using (bucket_id = 'track-audio');
create policy "artists upload track audio" on storage.objects for insert to authenticated with check (bucket_id = 'track-audio');
create policy "artists upload private rights docs" on storage.objects for insert to authenticated with check (bucket_id = 'rights-documents');
create policy "admins read rights docs" on storage.objects for select to authenticated using (bucket_id = 'rights-documents' and public.is_admin());

create index tracks_status_idx on public.tracks(status);
create index tracks_tags_idx on public.tracks using gin(mood_tags, activity_tags);
create index listening_events_user_created_idx on public.listening_events(user_id, created_at desc);

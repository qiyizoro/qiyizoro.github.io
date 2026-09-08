create table if not exists public.adventure_spots (
 id uuid primary key default gen_random_uuid(), place text not null, slot_key text not null,
 title text not null, description text not null default '', storage_path text not null unique,
 created_at timestamptz not null default now(), unique(place, slot_key)
);
alter table public.adventure_spots enable row level security;
drop policy if exists "members manage adventure spots" on public.adventure_spots;
create policy "members manage adventure spots" on public.adventure_spots for all to authenticated using (public.allowed_member()) with check (public.allowed_member());
create table if not exists public.site_data (
 key text primary key, value jsonb not null, updated_at timestamptz not null default now()
);
alter table public.site_data enable row level security;
drop policy if exists "members manage site data" on public.site_data;
create policy "members manage site data" on public.site_data for all to authenticated using (public.allowed_member()) with check (public.allowed_member());
drop policy if exists "members manage memories" on public.memory_photos;
create policy "world visitors manage memories" on public.memory_photos for all to authenticated using (true) with check (true);
drop policy if exists "members manage adventure spots" on public.adventure_spots;
create policy "world visitors manage adventure spots" on public.adventure_spots for all to authenticated using (true) with check (true);
drop policy if exists "members manage site data" on public.site_data;
create policy "world visitors manage site data" on public.site_data for all to authenticated using (true) with check (true);
drop policy if exists "members manage memory files" on storage.objects;
create policy "world visitors manage memory files" on storage.objects for all to authenticated using (bucket_id='memory-photos') with check (bucket_id='memory-photos');

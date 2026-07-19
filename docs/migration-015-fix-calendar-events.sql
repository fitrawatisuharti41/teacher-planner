-- ============================================================
-- Migration 015: Pastikan tabel calendar_events ada
-- (ketauan hilang dari database — kemungkinan ke-drop gak sengaja
-- di salah satu migration sebelumnya). Aman dijalankan berkali-kali.
-- ============================================================

create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  judul text not null,
  tanggal_mulai timestamptz not null,
  tanggal_selesai timestamptz,
  warna_label text,
  reminder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_calendar_events_owner on calendar_events(owner_id);

alter table calendar_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'calendar_events' and policyname = 'calendar_events_owner_crud'
  ) then
    create policy "calendar_events_owner_crud" on calendar_events
      for all
      using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
      with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));
  end if;
end $$;

-- ============================================================
-- SELESAI — migration 015
-- ============================================================

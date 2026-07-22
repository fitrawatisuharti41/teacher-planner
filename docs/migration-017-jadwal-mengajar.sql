-- ============================================================
-- Migration 017: Jadwal Mengajar Tetap (mingguan, berulang)
-- Beda dari calendar_events (yang buat event satu-kali kayak ujian/rapat).
-- Ini jadwal rutin Senin-Jumat yang dipakai buat "Jadwal Hari Ini" di Dashboard.
-- ============================================================

create table if not exists weekly_schedule (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  hari text not null, -- 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat'
  jam_mulai time not null,
  jam_selesai time not null,
  mapel text not null,
  created_at timestamptz not null default now(),
  constraint weekly_schedule_hari_check check (hari in ('senin','selasa','rabu','kamis','jumat'))
);
create index if not exists idx_weekly_schedule_owner on weekly_schedule(owner_id);

alter table weekly_schedule enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'weekly_schedule' and policyname = 'weekly_schedule_owner_crud'
  ) then
    create policy "weekly_schedule_owner_crud" on weekly_schedule
      for all
      using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
      with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));
  end if;
end $$;

-- ============================================================
-- SELESAI — migration 017
-- ============================================================

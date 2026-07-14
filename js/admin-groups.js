// js/admin-groups.js
// Dokumen administrasi (Modul Ajar, Prota, Promes, dst) itu levelnya per
// MAPEL + TINGKAT, bukan per section kelas — RPP IPA kelas 7 sama aja
// dipakai buat 7A/7B/7C, gak perlu diulang per section.
// Modul ini bikin daftar kelompok itu dari tabel `teaching_assignments`.

export async function getAdminGroups(supabase, teacherId) {
  const { data, error } = await supabase
    .from('teaching_assignments')
    .select('mapel, classes(id, nama_kelas, tingkat)')
    .eq('teacher_id', teacherId);

  if (error) {
    console.error('Gagal ambil penugasan mengajar:', error.message);
    return [];
  }

  const groupMap = new Map();
  (data || []).forEach((ta) => {
    if (!ta.classes) return;
    const key = `${ta.mapel}|${ta.classes.tingkat}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        mapel: ta.mapel,
        tingkat: ta.classes.tingkat,
        label: `${ta.mapel} — Kelas ${ta.classes.tingkat}`,
        classIds: [],
      });
    }
    groupMap.get(key).classIds.push(ta.classes.id);
  });

  return Array.from(groupMap.values());
}

/** Cari kelompok mana yang memuat class_id tertentu (buat nampilin label di list dokumen) */
export function findGroupForClassId(groups, classId) {
  return groups.find((g) => g.classIds.includes(classId));
}

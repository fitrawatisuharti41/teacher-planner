// Supabase Edge Function: grade-ulangan
// Lokasi: supabase/functions/grade-ulangan/index.ts
// Deploy: supabase functions deploy grade-ulangan
//
// CATATAN ARSITEKTUR: siswa TIDAK punya akun Supabase Auth (portal-ortu cuma
// pilih kelas + nama dari dropdown, tanpa login sungguhan) — sama seperti
// practice_answers.student_id. Karena itu identitas siswa di sini diambil
// dari `siswa_id` yang dikirim client, BUKAN dari JWT. Ini konsisten dengan
// model keamanan Teacher Planner yang sudah ada, tapi berarti tidak ada
// jaminan kriptografis bahwa siswa X benar-benar siswa X — sama seperti
// batasan yang sudah ada di fitur latihan soal lainnya.
//
// Tujuan utama fungsi ini: kunci_jawaban HANYA dibaca di sini (server),
// tidak pernah dikirim ke browser siswa lewat client biasa.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // aman dipakai server-side, JANGAN di client

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    const { sesi_id, siswa_id, jawaban } = body as {
      sesi_id: string;
      siswa_id: string;
      jawaban: { soal_id: string; jawaban: unknown }[];
    };
    if (!sesi_id || !siswa_id || !Array.isArray(jawaban)) {
      return jsonResponse({ error: "Payload tidak valid" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1) Pastikan sesi aktif
    const { data: sesi } = await admin
      .from("sesi_ulangan")
      .select("id, status, assessment_id")
      .eq("id", sesi_id)
      .single();
    if (!sesi || sesi.status !== "aktif") {
      return jsonResponse({ error: "Sesi ulangan tidak aktif" }, 400);
    }

    // 2) Pastikan siswa_id valid & benar-benar ada di kelas yang sesuai untuk sesi ini
    const { data: assessment } = await admin
      .from("assessments")
      .select("class_id")
      .eq("id", sesi.assessment_id)
      .single();

    const { data: siswa } = await admin
      .from("students")
      .select("id, class_id")
      .eq("id", siswa_id)
      .single();
    if (!siswa || !assessment || siswa.class_id !== assessment.class_id) {
      return jsonResponse({ error: "Siswa tidak terdaftar di kelas untuk sesi ini" }, 403);
    }

    // 3) Cegah submit ulang (replay)
    const { data: existing } = await admin
      .from("jawaban_siswa")
      .select("id")
      .eq("sesi_id", sesi_id)
      .eq("siswa_id", siswa_id)
      .limit(1);
    if (existing && existing.length > 0) {
      return jsonResponse({ error: "Jawaban untuk sesi ini sudah pernah dikumpulkan" }, 409);
    }

    // 4) Ambil soal LENGKAP (termasuk kunci_jawaban) — hanya di server ini
    const { data: soalList, error: soalErr } = await admin
      .from("bank_soal_ulangan")
      .select("*")
      .eq("sesi_id", sesi_id);
    if (soalErr || !soalList) {
      return jsonResponse({ error: "Gagal memuat soal" }, 500);
    }

    // 5) Grading per soal
    const rows = [];
    let skorOtomatis = 0;
    let maksOtomatis = 0;
    let pendingHots = 0;

    for (const soal of soalList) {
      const jwbEntry = jawaban.find((j) => j.soal_id === soal.id);
      const jwb = jwbEntry?.jawaban;
      let skor = 0;
      let status: "auto" | "pending_manual" = "auto";

      if (soal.tipe_soal === "pg_biasa" || soal.tipe_soal === "benar_salah") {
        skor = jwb === soal.kunci_jawaban ? soal.bobot : 0;
        maksOtomatis += soal.bobot;
      } else if (soal.tipe_soal === "pg_kompleks") {
        const a = Array.isArray(jwb) ? [...jwb].sort() : [];
        const b = [...(soal.kunci_jawaban as number[])].sort();
        skor = JSON.stringify(a) === JSON.stringify(b) ? soal.bobot : 0;
        maksOtomatis += soal.bobot;
      } else if (soal.tipe_soal === "menjodohkan") {
        const obj = (jwb as Record<string, string>) ?? {};
        const kunci = soal.kunci_jawaban as Record<string, number>;
        const totalPair = Object.keys(kunci).length;
        let benar = 0;
        for (const k of Object.keys(kunci)) {
          if (String(obj[k]) === String(kunci[k])) benar++;
        }
        skor = totalPair > 0 ? (benar / totalPair) * soal.bobot : 0;
        maksOtomatis += soal.bobot;
      } else if (soal.tipe_soal === "isian_singkat") {
        const norm = String(jwb ?? "").toLowerCase().trim().replace(/\s+/g, " ");
        const kunciList = (soal.kunci_jawaban as string[]).map((k) => k.toLowerCase().trim());
        skor = kunciList.includes(norm) ? soal.bobot : 0;
        maksOtomatis += soal.bobot;
      } else if (soal.tipe_soal === "uraian") {
        skor = 0; // menunggu guru
        status = "pending_manual";
        pendingHots += soal.bobot;
      }

      skorOtomatis += status === "auto" ? skor : 0;

      rows.push({
        sesi_id,
        soal_id: soal.id,
        siswa_id,
        jawaban: jwb ?? null,
        skor,
        status,
      });
    }

    // 6) Simpan semua jawaban sekaligus. Trigger DB (trg_sync_ke_assessment_items)
    //    otomatis push nilai ke assessment_items kalau tidak ada yang pending_manual.
    const { error: insertErr } = await admin.from("jawaban_siswa").insert(rows);
    if (insertErr) {
      return jsonResponse({ error: "Gagal menyimpan jawaban", detail: insertErr.message }, 500);
    }

    return jsonResponse({
      skor_otomatis: Math.round(skorOtomatis),
      maks_otomatis: maksOtomatis,
      pending_hots: pendingHots,
      status: pendingHots > 0 ? "menunggu_penilaian_manual" : "selesai",
    });
  } catch (e) {
    return jsonResponse({ error: "Terjadi kesalahan server", detail: String(e) }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// js/config/supabase.js
// Satu-satunya tempat inisialisasi Supabase client.
// Semua file js/*.js lain import dari sini, jangan bikin client baru di tempat lain.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// TODO: ganti kalau nanti pindah ke project Supabase lain
const SUPABASE_URL = 'https://uhibpjmmjbwwlhtuondl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaWJwam1tamJ3d2xodHVvbmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyODg1ODMsImV4cCI6MjA5ODg2NDU4M30._-Ih2QE55ukfhkv6fsGfUNIMTKkIhe2k2lqR3mv7Ab8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

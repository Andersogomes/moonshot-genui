// Public values (safe to ship). Data is protected by RLS + the scope wall inside the Edge Function.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://okiljlztobcnqxtmvzfi.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9raWxqbHp0b2JjbnF4dG12emZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMTQ0NDksImV4cCI6MjExMDY5MDQ0OX0.ADn5cTCJPt6NAI11O8sRdlfjEzRIkzEUyWPY9DgSz6Q";
export const GENERATE_URL = `${SUPABASE_URL}/functions/v1/generate-screen`;
/** Set EXPO_PUBLIC_OFFLINE=1 to skip the backend and generate on-device. */
export const FORCE_OFFLINE = process.env.EXPO_PUBLIC_OFFLINE === "1";

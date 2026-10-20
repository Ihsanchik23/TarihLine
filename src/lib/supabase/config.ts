export function getSupabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://saqfbeqxniwbfbfjndaw.supabase.co";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "sb_publishable_Jv4vUJPIfjQncGBlFquw8A_tg6uEUx0";

  return { url, publishableKey };
}

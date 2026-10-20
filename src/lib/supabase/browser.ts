import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const config = getSupabaseConfig();

  return createBrowserClient<Database>(config.url, config.publishableKey);
}

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

// SERVER ONLY: import this file only from app/api/* routes, never from components.
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
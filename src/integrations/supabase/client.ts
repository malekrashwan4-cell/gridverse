import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://qjidgahhrmxhokhvacec.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_Y19Cw8sUTW2SpwhaWdMSyg_BVrYCHsO";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

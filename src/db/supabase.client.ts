import { createClient, type SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export typed SupabaseClient for use throughout the application
export type SupabaseClient = BaseSupabaseClient<Database>;

export const DEFAULT_USER_ID = "e571a996-5d6f-40a0-92e8-f3fc7a4386c5";

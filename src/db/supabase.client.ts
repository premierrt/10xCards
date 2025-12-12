import { createClient, type SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

// Debug logging
console.log("Supabase config:", {
  url: supabaseUrl ? "configured" : "missing",
  key: supabaseAnonKey ? "configured" : "missing",
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase configuration. Please check your .env file.");
  console.error("Expected variables: SUPABASE_URL (or PUBLIC_SUPABASE_URL) and SUPABASE_KEY (or PUBLIC_SUPABASE_KEY)");
  console.error("URL:", supabaseUrl || "undefined");
  console.error("Key:", supabaseAnonKey || "undefined");
}

// Client-side Supabase client (for React components)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export typed SupabaseClient for use throughout the application
export type SupabaseClient = BaseSupabaseClient<Database>;

// Cookie options for SSR
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: false, // Set to false for localhost development
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

// Server-side Supabase client with SSR cookie support
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

// Deprecated - will be removed after migration
export const DEFAULT_USER_ID = "e571a996-5d6f-40a0-92e8-f3fc7a4386c5";

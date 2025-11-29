import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";
import { createMockSupabaseClient } from "../lib/services/supabase-mock.service";

export const onRequest = defineMiddleware((context, next) => {
  // Use mock Supabase client if in mock mode or no real credentials
  const useMock =
    import.meta.env.USE_MOCK_AI === "true" ||
    import.meta.env.USE_MOCK_AI === true ||
    !import.meta.env.SUPABASE_URL ||
    import.meta.env.SUPABASE_URL.includes("mock");

  if (useMock) {
    console.log("🔧 Using mock Supabase client");
    context.locals.supabase = createMockSupabaseClient();
  } else {
    context.locals.supabase = supabaseClient;
  }

  return next();
});

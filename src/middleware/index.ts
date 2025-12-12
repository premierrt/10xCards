import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register", "/api/auth/logout"];

// Protected paths that require authentication
const PROTECTED_PATHS = ["/generate", "/dashboard"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Add supabase instance to locals for use in pages
  locals.supabase = supabase;

  // Get user session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) {
    // User is authenticated, add to locals
    locals.user = {
      email: user.email!,
      id: user.id,
    };
  } else {
    // Check if this is a protected route
    const isProtectedRoute = PROTECTED_PATHS.some((path) => url.pathname.startsWith(path));

    if (isProtectedRoute) {
      // Redirect to login for protected routes
      return redirect("/login");
    }
  }

  return next();
});

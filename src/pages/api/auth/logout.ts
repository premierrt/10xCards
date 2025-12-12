import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  try {
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
    }

    // Check if request is from form (HTML form submission)
    const contentType = request.headers.get("content-type");
    const isFormData = contentType?.includes("application/x-www-form-urlencoded");

    if (isFormData) {
      // Redirect to login page for form submissions
      return redirect("/login");
    }

    // Return JSON response for API calls
    return new Response(
      JSON.stringify({
        message: "Wylogowano pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected logout error:", error);

    // Check if request is from form
    const contentType = request.headers.get("content-type");
    const isFormData = contentType?.includes("application/x-www-form-urlencoded");

    if (isFormData) {
      // Still redirect to login even on error
      return redirect("/login");
    }

    return new Response(
      JSON.stringify({
        error: "Wystąpił nieoczekiwany błąd",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

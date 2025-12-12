import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        error: 'Email i hasło są wymagane' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createSupabaseServerInstance({ 
      cookies, 
      headers: request.headers 
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      
      // Return user-friendly error message
      let errorMessage = 'Wystąpił błąd podczas logowania';
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Nieprawidłowy email lub hasło';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Potwierdź swój adres email przed logowaniem';
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      user: data.user,
      message: 'Zalogowano pomyślnie' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected login error:', error);
    return new Response(JSON.stringify({ 
      error: 'Wystąpił nieoczekiwany błąd' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
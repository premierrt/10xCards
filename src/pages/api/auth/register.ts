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

    // Basic password validation
    if (password.length < 8) {
      return new Response(JSON.stringify({ 
        error: 'Hasło musi mieć co najmniej 8 znaków' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!/\d/.test(password)) {
      return new Response(JSON.stringify({ 
        error: 'Hasło musi zawierać co najmniej jedną cyfrę' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createSupabaseServerInstance({ 
      cookies, 
      headers: request.headers 
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Registration error:', error);
      
      // Return user-friendly error message
      let errorMessage = 'Wystąpił błąd podczas rejestracji';
      if (error.message.includes('User already registered')) {
        errorMessage = 'Email jest już zarejestrowany';
      } else if (error.message.includes('Password should be')) {
        errorMessage = 'Hasło jest zbyt słabe';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Nieprawidłowy format email';
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      user: data.user,
      message: 'Konto utworzone pomyślnie. Możesz się teraz zalogować.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected registration error:', error);
    return new Response(JSON.stringify({ 
      error: 'Wystąpił nieoczekiwany błąd' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
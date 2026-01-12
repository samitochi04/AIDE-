import { createClient } from '@supabase/supabase-js';

// Supabase client options with timeout
const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
    },
  },
};

// Client for authenticated user operations (uses user's JWT)
export const createSupabaseClient = (accessToken) => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      ...supabaseOptions,
      global: {
        ...supabaseOptions.global,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
};

// Admin client with service role (bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseOptions
);

export default supabaseAdmin;

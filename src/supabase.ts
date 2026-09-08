import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://bwspbjatblwcfjgkuqbm.supabase.co',
  'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);

export const MEMORY_BUCKET = 'memory-photos';

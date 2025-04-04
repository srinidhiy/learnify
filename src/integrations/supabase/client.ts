// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bfphpatwzwzjevawripk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmcGhwYXR3end6amV2YXdyaXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk3MzYsImV4cCI6MjA1MTI1NTczNn0.pMbqa6qy1SCengJXbkRjftG-MBditzuruqcI1Juf7Y4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
      storage: window.localStorage
    }
  });
  
  
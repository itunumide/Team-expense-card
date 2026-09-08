import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

// Polyfill WebSocket for Node.js < 22
if (typeof globalThis.WebSocket === 'undefined') {
  const WebSocket = ws.default || ws;
  (globalThis as any).WebSocket = WebSocket;
}

function createSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY in environment');
  }

  return createClient(url, key);
}

export const supabase = createSupabaseClient();

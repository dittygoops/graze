import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface RestaurantRecord {
  id?: number;
  name: string;
  address?: string;
  lat?: number;
  long?: number;
  place_id?: string;
  rating?: number;
  total_ratings?: number;
  tags?: string[];
}

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    if (!url || !key) {
      console.warn('Supabase credentials not found in environment variables');
      return null;
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

export async function getRestaurantFromDb(name: string): Promise<RestaurantRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('[DB] No Supabase client — skipping fetch for:', name);
    return null;
  }

  const { data, error } = await supabase.from('Restaurant').select('*').eq('name', name).maybeSingle();

  if (error) {
    console.error('[DB] Error fetching restaurant:', name, error);
    return null;
  }

  console.log(`[DB] Fetch "${name}":`, data ? `found (tags: ${data.tags})` : 'not found');
  return data ?? null;
}

export async function storeRestaurant(record: RestaurantRecord): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('[DB] No Supabase client — skipping store for:', record.name);
    return false;
  }

  const { data: existing, error: fetchError } = await supabase
    .from('Restaurant').select('id').eq('name', record.name).maybeSingle();

  if (fetchError) {
    console.error('[DB] Error checking existence for:', record.name, fetchError);
    return false;
  }

  if (existing) {
    console.log(`[DB] Updating "${record.name}"`);
    const { error } = await supabase.from('Restaurant').update(record).eq('name', record.name);
    if (error) { console.error('[DB] Update failed:', error); return false; }
  } else {
    console.log(`[DB] Inserting "${record.name}"`);
    const { error } = await supabase.from('Restaurant').insert(record);
    if (error) { console.error('[DB] Insert failed:', error); return false; }
  }

  console.log(`[DB] Stored "${record.name}" ✓`);
  return true;
}

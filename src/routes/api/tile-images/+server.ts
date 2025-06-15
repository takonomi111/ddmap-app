import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('tile-images')
    .select('tile, image_url, memo, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tile-images:', error);
    return json({ error: 'Failed to fetch tile images' }, { status: 500 });
  }

  return json(data);
}

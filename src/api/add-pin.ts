import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  const { tile, x, y, category, color, memo, important, shap } = data;

  const { error } = await supabase.from('pins').insert([
    {
      tile,
      x,
      y,
      category,
      color,
      memo,
      important,
      shap,
      created_at: new Date().toISOString()
    }
  ]);

  if (error) {
    console.error('Insert error:', error.message);
    return json({ success: false, error: error.message }, { status: 500 });
  }

  return json({ success: true });
};

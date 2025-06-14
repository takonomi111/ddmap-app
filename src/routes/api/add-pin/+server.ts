import { json } from '@sveltejs/kit'
import { supabase } from '$lib/supabase'

export async function POST({ request }) {
  const body = await request.json()

  const { tile, x, y, category, color, memo, important, shape } = body

  const { error } = await supabase.from('pins').insert([
    { tile, x, y, category, color, memo, important, shape }
  ])

  if (error) {
    console.error('Error inserting pin:', error)
    return json({ success: false, error: error.message }, { status: 500 })
  }

  return json({ success: true })
}

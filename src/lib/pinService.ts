// src/lib/pinService.ts
import { supabase } from './supabase';

export async function loadPins() {
  const { data, error } = await supabase.from('pins').select('*');
  if (error) throw error;
  return data ?? [];
}

// pinService.ts
export async function addPin(pin) {
  const { data, error } = await supabase
    .from('pins')
    .insert(pin)
    .select()
    .single(); // ← 挿入されたレコード1件を取得

  if (error || !data) throw error || new Error('ピンの追加に失敗しました');
  return data;
}

export async function deletePinById(id: string) {
  const { error } = await supabase.from('pins').delete().eq('id', id);
  if (error) throw error;
}

export async function updatePinById(id: string, updates) {
  const { error } = await supabase.from('pins').update(updates).eq('id', id);
  if (error) throw error;
}

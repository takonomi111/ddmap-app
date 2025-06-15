// src/lib/categoryService.ts
import { supabase } from './supabase';

export async function loadCategoryOptions() {
  const { data, error } = await supabase
    .from('category_options')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function addCategoryOption(name: string, color: string) {
  const { data, error } = await supabase
    .from('category_options')
    .insert({ name, color })
    .select()
    .single();

  if (error) throw error;
  return data;
}

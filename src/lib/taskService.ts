import { supabase } from '$lib/supabase';

export async function loadTasks() {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) throw error;
  return data;
}

export async function addTask(task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  if (error || !data) throw error || new Error('タスク追加失敗');
  return data;
}

export async function toggleTaskDone(id: string, done: boolean) {
  return await supabase.from('tasks').update({ done }).eq('id', id);
}

export async function deleteTask(id: string) {
  return await supabase.from('tasks').delete().eq('id', id);
}

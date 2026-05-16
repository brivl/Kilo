import { supabase } from '@/lib/supabase';

export async function upsertRow(
  table: string,
  row: Record<string, unknown>,
  userId: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase.from(table).upsert({ ...row, user_id: userId });
  return { error };
}

export async function softDeleteRow(table: string, id: string): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  return { error };
}

export async function fetchAllRows(
  table: string,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);
  if (error) return [];
  return (data as Record<string, unknown>[] | null) ?? [];
}

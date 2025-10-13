import { createClient } from '@/utils/supabase/server';


export async function getAthletesForCoach() {
const supabase = createClient();
const { data, error } = await supabase.from('athletes').select('*').order('updated_at', { ascending: false });
if (error) throw error;
return data;
}
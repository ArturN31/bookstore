import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

export const fetchDiscountByCode = async (supabase: SupabaseClient<Database>, code: string) => {
    return supabase
        .from('discounts')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();
};

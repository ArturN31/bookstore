import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
	return createBrowserClient(process.env.SUPABASE_DB_URL!, process.env.SUPABASE_DB_ANON_PUBLIC_KEY!);
}

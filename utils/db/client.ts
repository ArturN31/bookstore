import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_DB_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_DB_ANON_PUBLIC_KEY!,
	);
}

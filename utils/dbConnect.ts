import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const SUPABASE_DB_ANON_PUBLIC_KEY = process.env.SUPABASE_DB_ANON_PUBLIC_KEY;
const SUPABASE_DB_SERVICE_ROLE_KEY = process.env.SUPABASE_DB_SERVICE_ROLE_KEY;

let supabaseAnonClient: SupabaseClient<Database> | null = null;
let supabaseServiceClient: SupabaseClient<Database> | null = null;

export const getSupabaseAnonClient = (): SupabaseClient<Database> => {
	if (!supabaseAnonClient) {
		if (!SUPABASE_DB_URL || !SUPABASE_DB_ANON_PUBLIC_KEY) {
			throw new Error('Failed to load database credentials.');
		}

		supabaseAnonClient = createClient<Database>(SUPABASE_DB_URL, SUPABASE_DB_ANON_PUBLIC_KEY);
	}

	return supabaseAnonClient;
};

export const getSupabaseServiceClient = (): SupabaseClient<Database> => {
	if (!supabaseServiceClient) {
		if (!SUPABASE_DB_URL || !SUPABASE_DB_SERVICE_ROLE_KEY) {
			throw new Error('Failed to load database credentials.');
		}

		supabaseServiceClient = createClient<Database>(SUPABASE_DB_URL, SUPABASE_DB_SERVICE_ROLE_KEY);
	}

	return supabaseServiceClient;
};

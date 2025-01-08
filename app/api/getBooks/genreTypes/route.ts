import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../database.types';

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const SUPABASE_DB_ANON_PUBLIC_KEY = process.env.SUPABASE_DB_ANON_PUBLIC_KEY;

export const GET = async () => {
	if (!SUPABASE_DB_URL || !SUPABASE_DB_ANON_PUBLIC_KEY) {
		return NextResponse.json({ message: 'Failed to load database credentials.' }, { status: 500 });
	}

	try {
		const supabase = createClient<Database>(SUPABASE_DB_URL, SUPABASE_DB_ANON_PUBLIC_KEY);
		const { data, error } = await supabase.from('books').select('genre');

		if (error) {
			return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 200 });
		}

		let genres: string[] = [];

		data.forEach((book) => {
			if (!genres.includes(book.genre)) genres.push(book.genre);
		});

		return NextResponse.json({ genres: genres }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 500 });
	}
};

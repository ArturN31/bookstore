import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from './../../../database.types';

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const SUPABASE_DB_ANON_PUBLIC_KEY = process.env.SUPABASE_DB_ANON_PUBLIC_KEY;
const SUPABASE_DB_SERVICE_ROLE_KEY = process.env.SUPABASE_DB_SERVICE_ROLE_KEY;

export const GET = async () => {
	if (!SUPABASE_DB_URL || !SUPABASE_DB_ANON_PUBLIC_KEY) {
		return NextResponse.json({ message: 'Failed to load database credentials.' }, { status: 500 });
	}

	try {
		const supabase = createClient<Database>(SUPABASE_DB_URL, SUPABASE_DB_ANON_PUBLIC_KEY);
		const { data, error } = await supabase.from('books').select('*');

		if (error) {
			return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 200 });
		}
		return NextResponse.json({ books: data }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 500 });
	}
};

export const POST = async (req: NextRequest) => {
	const body = await req.json();
	const { books }: { books: GeneratedBook[] } = body;

	if (!body) {
		return NextResponse.json({ message: 'Parameters not passed with the request.' }, { status: 400 });
	}

	if (!books) {
		return NextResponse.json({ message: 'Books not passed with the request.' }, { status: 400 });
	}

	if (!SUPABASE_DB_URL || !SUPABASE_DB_SERVICE_ROLE_KEY) {
		return NextResponse.json({ message: 'Failed to load database credentials.' }, { status: 500 });
	}

	try {
		const supabase = createClient<Database>(SUPABASE_DB_URL, SUPABASE_DB_SERVICE_ROLE_KEY);
		const { error } = await supabase.from('books').insert(books).select();

		if (error) {
			return NextResponse.json({ message: 'Failed to insert books into the database.' }, { status: 200 });
		}

		return NextResponse.json({ message: 'Book(s) have been added to the database.' }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to insert books into the database.' }, { status: 500 });
	}
};

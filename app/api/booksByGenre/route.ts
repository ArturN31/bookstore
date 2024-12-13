import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from './../../../database.types';

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const SUPABASE_DB_ANON_PUBLIC_KEY = process.env.SUPABASE_DB_ANON_PUBLIC_KEY;

export const POST = async (req: NextRequest) => {
	const body = await req.json();
	const { genre }: { genre: string } = body;

	if (!body) {
		return NextResponse.json({ message: 'Parameters not passed with the request.' }, { status: 400 });
	}

	if (!genre) {
		return NextResponse.json({ message: 'Genre not passed with the request.' }, { status: 400 });
	}

	if (!SUPABASE_DB_URL || !SUPABASE_DB_ANON_PUBLIC_KEY) {
		return NextResponse.json({ message: 'Failed to load database credentials.' }, { status: 500 });
	}

	try {
		const supabase = createClient<Database>(SUPABASE_DB_URL, SUPABASE_DB_ANON_PUBLIC_KEY);
		const { data, error } = await supabase.from('books').select('*');

		if (error) {
			return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 200 });
		}

		let books: any = [];

		data.forEach((book) => {
			if (book.genre === genre) books.push(book);
		});

		return NextResponse.json({ books: books }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 500 });
	}
};

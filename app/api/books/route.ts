import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/db/server';

export const GET = async () => {
	try {
		const supabase = await createClient();
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

	try {
		const supabase = await createClient();
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

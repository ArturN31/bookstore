import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnonClient } from '@/utils/dbConnect';

export const POST = async (req: NextRequest) => {
	try {
		const body = await req.json();
		const { genre }: { genre: string } = body;

		if (!body) {
			return NextResponse.json({ message: 'Parameters not passed with the request.' }, { status: 400 });
		}

		if (!genre) {
			return NextResponse.json({ message: 'Genre not passed with the request.' }, { status: 400 });
		}

		const supabase = getSupabaseAnonClient();
		const { data, error } = await supabase.from('books').select('*').eq('genre', genre);

		if (error) {
			return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 500 });
		}

		if (!data.length) {
			return NextResponse.json({ message: 'No books found.' }, { status: 200 });
		}

		return NextResponse.json({ books: data }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 500 });
	}
};

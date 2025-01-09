import { NextResponse } from 'next/server';
import { getSupabaseAnonClient } from '@/utils/dbConnect';

export const GET = async () => {
	try {
		const supabase = getSupabaseAnonClient();
		const { data, error } = await supabase.from('books').select('genre');

		if (error) {
			return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 500 });
		}

		if (!data.length) {
			return NextResponse.json({ message: 'No book genres found.' }, { status: 200 });
		}

		let genres: string[] = [...new Set(data.map((entry) => entry.genre))];

		return NextResponse.json({ genres: genres }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 500 });
	}
};

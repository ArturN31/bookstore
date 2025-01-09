import { NextResponse } from 'next/server';
import { getSupabaseAnonClient } from '@/utils/dbConnect';

export const GET = async () => {
	try {
		const supabase = getSupabaseAnonClient();
		const { data, error } = await supabase.from('books').select('format');

		if (error) {
			return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 500 });
		}

		if (!data.length) {
			return NextResponse.json({ message: 'No book formats found.' }, { status: 200 });
		}

		let formats: string[] = [...new Set(data.map((entry) => entry.format))];

		return NextResponse.json({ formats: formats }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to retrieve books from database.' }, { status: 500 });
	}
};

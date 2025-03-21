import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/db/server';

export const GET = async () => {
	try {
		const supabase = await createClient();
		const { data, error } = await supabase.from('book_reviews').select('*');

		if (error) {
			return NextResponse.json({ message: 'Failed to retrieve reviews from database.' }, { status: 200 });
		}
		return NextResponse.json({ reviews: data }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to retrieve reviews from database.' }, { status: 500 });
	}
};

export const POST = async (req: NextRequest) => {
	const body = await req.json();
	const { reviews }: { reviews: GeneratedReview[] } = body;

	if (!body) {
		return NextResponse.json({ message: 'Parameters not passed with the request.' }, { status: 400 });
	}

	if (!reviews) {
		return NextResponse.json({ message: 'Review(s) not passed with the request.' }, { status: 400 });
	}

	try {
		const supabase = await createClient();
		const { error } = await supabase.from('book_reviews').insert(reviews).select();

		if (error) {
			return NextResponse.json({ message: 'Failed to insert review(s) into the database.' }, { status: 200 });
		}

		return NextResponse.json({ message: 'Review(s) have been added to the database.' }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to insert review(s) into the database.' }, { status: 500 });
	}
};

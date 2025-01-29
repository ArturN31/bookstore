import { RootLayout } from '@/components/layout/Layout';
import { createClient } from '@/utils/db/server';
import { PostgrestResponse } from '@supabase/supabase-js';

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
	const slug = (await params).slug;

	const getBooks = async (genre: any) => {
		const supabase = await createClient();
		const { data, error }: PostgrestResponse<Book> = await supabase.from('books').select('*').eq('genre', genre);

		if (error) {
			console.log(error);
			return 'Could not retrieve books for this genre.';
		}

		if (data.length < 1) return 'There are no books for this genre.';

		console.log(data);
	};

	if (slug) getBooks(slug);

	return (
		<RootLayout>
			<p>Genre: {slug}</p>
		</RootLayout>
	);
}
